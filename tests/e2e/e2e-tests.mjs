// Pruebas de ACEPTACIÓN End-to-End sobre el sistema desplegado (a través del gateway).
// Recorre el flujo completo del negocio. Requiere Node 18+. Ejecutar: node tests/e2e/e2e-tests.mjs
const BASE = process.env.BASE_URL || 'http://localhost';
const MAILPIT = process.env.MAILPIT_URL || 'http://localhost:8025';
const JSONH = { 'Content-Type': 'application/json' };
let pass = 0, fail = 0;

async function call(method, path, body, token) {
  const headers = { ...JSONH };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await r.json(); } catch { /* vacío */ }
  return { status: r.status, data };
}
function step(id, name, cond, info = '') {
  cond ? pass++ : fail++;
  console.log(`${cond ? '✅' : '❌'} ${id} ${name}${info ? '  (' + info + ')' : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const email = `e2e_${Date.now()}@test.com`;

// HU-01 Registro e inicio de sesión
let r = await call('POST', '/api/auth/register', { nombre: 'Cliente E2E', email, password: 'Cliente123' });
step('CA-01', 'Un visitante puede registrarse', r.status === 201, r.status);
r = await call('POST', '/api/auth/login', { email, password: 'Cliente123' });
step('CA-02', 'El cliente puede iniciar sesión y recibe un JWT', r.status === 200 && r.data.token?.split('.').length === 3);
const token = r.data.token;

// HU-02 Catálogo
r = await call('GET', '/api/products?size=50');
step('CA-03', 'El catálogo lista productos', r.status === 200 && r.data.content.length > 0, `${r.data?.content?.length} productos`);
const prod = r.data.content.find((p) => p.stock >= 2);
r = await call('GET', '/api/products?q=teclado');
step('CA-04', 'La búsqueda filtra por nombre', r.data.content.every((p) => /teclado/i.test(p.nombre + p.descripcion)));
r = await call('GET', '/api/products?categoria=Deportes');
step('CA-05', 'El filtro por categoría funciona', r.data.content.length > 0 && r.data.content.every((p) => p.categoria === 'Deportes'));

// HU-03 Compra
const stockAntes = prod.stock;
r = await call('POST', '/api/orders', { items: [{ productoId: prod.id, cantidad: 2 }], metodoPago: 'TARJETA', numeroTarjeta: '4111111111111111', direccionEnvio: 'Calle 10 # 5-20, Neiva' }, token);
step('CA-06', 'El cliente compra con tarjeta aprobada', r.status === 201 && r.data.estado === 'PAGADO', r.status);
const pedido = r.data;
step('CA-07', 'El total del pedido es correcto', Number(pedido.total) === Number(prod.precio) * 2, pedido.total);
r = await call('GET', `/api/products/${prod.id}`);
step('CA-08', 'El stock se descuenta (comunicación síncrona order -> catalog)', r.data.stock === stockAntes - 2, `${stockAntes} -> ${r.data.stock}`);
r = await call('POST', '/api/orders', { items: [{ productoId: prod.id, cantidad: 1 }], metodoPago: 'TARJETA', numeroTarjeta: '4000000000000002', direccionEnvio: 'Calle 10 # 5-20' }, token);
step('CA-09', 'Un pago rechazado no crea pedido (402)', r.status === 402, r.status);
r = await call('GET', `/api/products/${prod.id}`);
step('CA-10', 'Tras el rechazo, el stock se compensa', r.data.stock === stockAntes - 2, r.data.stock);
r = await call('GET', '/api/products?size=50');
const escaso = r.data.content.find((p) => p.stock > 0 && p.stock < 20);
if (escaso) {
  r = await call('POST', '/api/orders', { items: [{ productoId: escaso.id, cantidad: escaso.stock + 1 }], metodoPago: 'CONTRAENTREGA', direccionEnvio: 'Calle 10 # 5-20' }, token);
  step('CA-11', 'No se puede comprar más que el stock disponible (409)', r.status === 409, r.status);
}

// HU-04 Seguimiento
r = await call('GET', '/api/orders/mine', null, token);
step('CA-12', 'El cliente ve su pedido en "Mis pedidos"', r.data.some((o) => o.id === pedido.id));

// HU-05 Notificación asíncrona (RabbitMQ -> notification-service -> correo)
await sleep(3000);
try {
  const m = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent('to:' + email)}`)).json();
  step('CA-13', 'Llega el correo de confirmación (evento asíncrono)', m.messages_count > 0, `${m.messages_count} correo(s)`);
} catch {
  step('CA-13', 'Llega el correo de confirmación (Mailpit no accesible)', false);
}

// HU-06 Chatbot
r = await call('POST', '/api/chat', { mensaje: 'hola' });
step('CA-14', 'El chatbot saluda y muestra el menú', r.status === 200 && r.data.opciones.length > 0);
r = await call('POST', '/api/chat', { mensaje: `estado pedido ${pedido.id}` }, token);
step('CA-15', 'El chatbot consulta el estado real del pedido', r.data.respuesta.includes('PAGADO'), r.data.respuesta.slice(0, 60));
r = await call('POST', '/api/chat', { mensaje: 'precio de teclado' });
step('CA-16', 'El chatbot busca productos en el catálogo', /teclado/i.test(r.data.respuesta));

// HU-07 Administración
r = await call('POST', '/api/auth/login', { email: process.env.ADMIN_EMAIL || 'admin@shopnova.com', password: process.env.ADMIN_PASSWORD || 'Admin123*' });
const admin = r.data.token;
step('CA-17', 'El administrador inicia sesión', r.status === 200 && r.data.usuario.rol === 'ADMIN');
r = await call('PATCH', `/api/orders/${pedido.id}/status`, { estado: 'ENVIADO' }, admin);
step('CA-18', 'El administrador marca el pedido como ENVIADO', r.status === 200 && r.data.estado === 'ENVIADO');
r = await call('PATCH', `/api/orders/${pedido.id}/status`, { estado: 'CANCELADO' }, token);
step('CA-19', 'Un pedido enviado ya no se puede cancelar (409)', r.status === 409, r.status);
r = await call('POST', '/api/products', { nombre: 'Producto E2E', descripcion: 'Creado por prueba', precio: 1000, stock: 3, categoria: 'Hogar' }, admin);
step('CA-20', 'El administrador crea un producto', r.status === 201);
if (r.data?.id) {
  r = await call('DELETE', `/api/products/${r.data.id}`, null, admin);
  step('CA-21', 'El administrador elimina un producto', r.status === 204);
}

console.log(`\nResultado E2E: ${pass} aprobadas, ${fail} fallidas`);
process.exit(fail ? 1 : 0);
