// Prueba de ESTRÉS con k6: sube la carga hasta encontrar el punto de quiebre del sistema.
// Ejecutar: k6 run tests/performance/stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 300 },   // por encima de la capacidad esperada
    { duration: '30s', target: 0 },     // recuperación
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(99)<3000'],
  },
};

export default function () {
  const r = http.get(`${BASE}/api/products?page=${Math.floor(Math.random() * 2)}&size=12`);
  check(r, { 'status 200': (x) => x.status === 200, '429 (rate limit)': (x) => x.status === 429 });
  const c = http.post(`${BASE}/api/chat`, JSON.stringify({ mensaje: 'precio de mouse' }),
    { headers: { 'Content-Type': 'application/json' } });
  check(c, { 'chat 200': (x) => x.status === 200 });
  sleep(0.5);
}

export function handleSummary(data) {
  return { 'tests/performance/resultado-estres.json': JSON.stringify(data, null, 2) };
}
