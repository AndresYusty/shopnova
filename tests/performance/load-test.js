// Prueba de CARGA con k6: simula usuarios navegando el catálogo, usando el chatbot y comprando.
// Ejecutar: k6 run tests/performance/load-test.js
//   (o con Docker: docker run --rm -i --network host grafana/k6 run - < tests/performance/load-test.js)
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost';
const tCatalogo = new Trend('t_catalogo', true);
const tPedido = new Trend('t_crear_pedido', true);
const tChat = new Trend('t_chatbot', true);
const errores = new Rate('errores_negocio');

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // calentamiento
    { duration: '1m', target: 50 },   // carga normal esperada
    { duration: '30s', target: 0 },   // enfriamiento
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],      // 95% de peticiones por debajo de 800 ms
    http_req_failed: ['rate<0.01'],        // menos de 1% de errores
    t_crear_pedido: ['p(95)<1500'],
    errores_negocio: ['rate<0.02'],
  },
};

const JSON_H = { 'Content-Type': 'application/json' };

// Cada usuario virtual crea su propia cuenta al inicio
export function setup() {
  const r = http.get(`${BASE}/api/products?size=50`);
  return { productos: r.json('content').map((p) => p.id) };
}

export default function (data) {
  const email = `k6_${__VU}_${Date.now()}@test.com`;
  let token;

  group('1. Navegar catálogo', () => {
    const r1 = http.get(`${BASE}/api/products?page=0&size=12`);
    tCatalogo.add(r1.timings.duration);
    check(r1, { 'catálogo 200': (r) => r.status === 200 });
    const r2 = http.get(`${BASE}/api/products?q=audifonos`);
    check(r2, { 'búsqueda 200': (r) => r.status === 200 });
  });
  sleep(1);

  group('2. Chatbot', () => {
    const r = http.post(`${BASE}/api/chat`, JSON.stringify({ mensaje: '¿Cuánto tarda el envío?' }), { headers: JSON_H });
    tChat.add(r.timings.duration);
    check(r, { 'chat 200': (x) => x.status === 200 });
  });
  sleep(1);

  // Solo 30% de los usuarios compra (comportamiento realista de e-commerce)
  if (Math.random() < 0.3) {
    group('3. Registro y compra', () => {
      const reg = http.post(`${BASE}/api/auth/register`,
        JSON.stringify({ nombre: 'Usuario K6', email, password: 'Prueba123' }), { headers: JSON_H });
      check(reg, { 'registro 201': (r) => r.status === 201 });
      token = reg.json('token');
      if (!token) { errores.add(1); return; }
      const pid = data.productos[Math.floor(Math.random() * data.productos.length)];
      const body = { items: [{ productoId: pid, cantidad: 1 }], metodoPago: 'CONTRAENTREGA', direccionEnvio: 'Calle 1 # 2-3' };
      const r = http.post(`${BASE}/api/orders`, JSON.stringify(body),
        { headers: { ...JSON_H, Authorization: `Bearer ${token}` } });
      tPedido.add(r.timings.duration);
      // 409 = sin stock: es una respuesta de negocio válida bajo carga, no un fallo técnico
      const ok = check(r, { 'pedido 201 o 409': (x) => x.status === 201 || x.status === 409 });
      errores.add(!ok);
    });
  }
  sleep(1);
}

export function handleSummary(data) {
  return {
    'tests/performance/resultado-carga.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(d) {
  const m = d.metrics;
  const f = (x) => (x ? x.toFixed(1) : '-');
  return `
=== RESUMEN PRUEBA DE CARGA ===
Peticiones totales:   ${m.http_reqs.values.count}  (${f(m.http_reqs.values.rate)} req/s)
Errores HTTP:         ${(m.http_req_failed.values.rate * 100).toFixed(2)} %
Tiempo resp. promedio ${f(m.http_req_duration.values.avg)} ms | p90 ${f(m.http_req_duration.values['p(90)'])} ms | p95 ${f(m.http_req_duration.values['p(95)'])} ms
Catálogo p95:         ${f(m.t_catalogo?.values['p(95)'])} ms
Chatbot p95:          ${f(m.t_chatbot?.values['p(95)'])} ms
Crear pedido p95:     ${f(m.t_crear_pedido?.values['p(95)'])} ms
`;
}
