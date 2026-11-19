// Pruebas automáticas de seguridad (basadas en OWASP Top 10 2021).
// Requiere Node 18+ (sin dependencias). Ejecutar: node tests/security/security-tests.mjs
const BASE = process.env.BASE_URL || 'http://localhost';
const JSONH = { 'Content-Type': 'application/json' };
const results = [];

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  let body = null;
  try { body = await res.json(); } catch { /* sin cuerpo */ }
  return { status: res.status, body, headers: res.headers };
}
function test(owasp, name, ok, detail = '') {
  results.push({ owasp, name, ok });
  console.log(`${ok ? '✅' : '❌'} [${owasp}] ${name}${detail ? ' -> ' + detail : ''}`);
}

const email = `sec_${Date.now()}@test.com`;
const reg = await req('/api/auth/register', { method: 'POST', headers: JSONH, body: JSON.stringify({ nombre: 'Sec', email, password: 'Segura123' }) });
const token = reg.body?.token;
const auth = { ...JSONH, Authorization: `Bearer ${token}` };

// A01 - Control de acceso roto
let r = await req('/api/orders/mine');
test('A01', 'Pedidos sin token -> 401', r.status === 401, r.status);
r = await req('/api/products', { method: 'POST', headers: auth, body: JSON.stringify({ nombre: 'X', precio: 1, stock: 1, categoria: 'X' }) });
test('A01', 'Cliente no puede crear productos -> 403', r.status === 403, r.status);
r = await req('/api/orders', { headers: auth });
test('A01', 'Cliente no puede listar todos los pedidos -> 403', r.status === 403, r.status);
r = await req('/api/orders/1', { headers: auth });
test('A01', 'IDOR: no puede ver pedidos ajenos -> 404', r.status === 404, r.status);
r = await req('/internal/products/1/reserve', { method: 'POST', headers: JSONH, body: JSON.stringify({ cantidad: 1 }) });
test('A01', 'Endpoints internos no expuestos en el gateway -> 404', r.status === 404, r.status);
r = await req('/api/auth/register', { method: 'POST', headers: JSONH, body: JSON.stringify({ nombre: 'Hack', email: `h_${Date.now()}@t.com`, password: 'Segura123', rol: 'ADMIN' }) });
test('A01', 'Registro ignora el campo "rol" (sin escalada de privilegios)', r.body?.usuario?.rol === 'CLIENTE', r.body?.usuario?.rol);

// A02 - Fallas criptográficas
test('A02', 'La respuesta de registro no expone la contraseña', !JSON.stringify(reg.body).includes('Segura123') && !('password' in (reg.body?.usuario || {})));
const forged = token ? token.split('.').slice(0, 2).join('.') + '.firmaFalsa' : 'x';
r = await req('/api/orders/mine', { headers: { Authorization: `Bearer ${forged}` } });
test('A02', 'JWT con firma alterada -> 401', r.status === 401, r.status);
const none = Buffer.from('{"alg":"none"}').toString('base64url') + '.' + Buffer.from('{"sub":"a","uid":1,"rol":"ADMIN"}').toString('base64url') + '.';
r = await req('/api/orders', { headers: { Authorization: `Bearer ${none}` } });
test('A02', 'JWT con alg "none" -> 401', r.status === 401, r.status);

// A03 - Inyección
r = await req("/api/products?q=' OR '1'='1");
test('A03', 'Inyección SQL en búsqueda no devuelve todo el catálogo', r.status === 200 && r.body.content.length === 0, `${r.status}, ${r.body?.content?.length} resultados`);
r = await req("/api/auth/login", { method: 'POST', headers: JSONH, body: JSON.stringify({ email: "admin@shopnova.com' --", password: 'x' }) });
test('A03', 'Inyección SQL en login rechazada', r.status === 400 || r.status === 401, r.status);
r = await req('/api/orders', { method: 'POST', headers: auth, body: JSON.stringify({ items: [{ productoId: 1, cantidad: 1 }], metodoPago: 'CONTRAENTREGA', direccionEnvio: '<script>alert(1)</script>' }) });
test('A03', 'XSS en dirección de envío rechazado -> 400', r.status === 400, r.status);
r = await req('/api/orders', { method: 'POST', headers: auth, body: JSON.stringify({ items: [{ productoId: 1, cantidad: -5 }], metodoPago: 'CONTRAENTREGA', direccionEnvio: 'Calle 1' }) });
test('A03', 'Cantidad negativa rechazada -> 400', r.status === 400, r.status);
r = await req('/api/orders', { method: 'POST', headers: auth, body: '{malformado' });
test('A03', 'JSON malformado -> 400 sin traza interna', r.status === 400 && !JSON.stringify(r.body).includes('Exception'), r.status);

// A05 - Configuración de seguridad
r = await req('/');
test('A05', 'Cabecera X-Content-Type-Options', r.headers.get('x-content-type-options') === 'nosniff');
test('A05', 'Cabecera X-Frame-Options (clickjacking)', r.headers.get('x-frame-options') === 'DENY');
test('A05', 'Cabecera Content-Security-Policy', !!r.headers.get('content-security-policy'));
test('A05', 'No revela versión de Nginx', !/\d/.test(r.headers.get('server') || ''), r.headers.get('server'));

// A07 - Fallas de identificación y autenticación
r = await req('/api/auth/register', { method: 'POST', headers: JSONH, body: JSON.stringify({ nombre: 'Débil', email: `d_${Date.now()}@t.com`, password: '123' }) });
test('A07', 'Contraseña débil rechazada -> 400', r.status === 400, r.status);
const a = await req('/api/auth/login', { method: 'POST', headers: JSONH, body: JSON.stringify({ email: 'noexiste@t.com', password: 'Xx123456' }) });
const b = await req('/api/auth/login', { method: 'POST', headers: JSONH, body: JSON.stringify({ email, password: 'Incorrecta1' }) });
test('A07', 'Mismo mensaje para usuario inexistente y clave errada (anti-enumeración)', a.body?.error === b.body?.error, a.body?.error);
let got429 = false;
for (let i = 0; i < 20 && !got429; i++) {
  const x = await req('/api/auth/login', { method: 'POST', headers: JSONH, body: JSON.stringify({ email, password: 'Incorrecta' + i }) });
  got429 = x.status === 429;
}
test('A07', 'Rate limiting en login (fuerza bruta) -> 429', got429);

const ok = results.filter((x) => x.ok).length;
console.log(`\nResultado: ${ok}/${results.length} pruebas superadas`);
process.exit(ok === results.length ? 0 : 1);
