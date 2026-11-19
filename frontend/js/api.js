// Cliente HTTP: todas las peticiones pasan por el API Gateway en /api
import { state } from './state.js';

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && state.token) headers.Authorization = 'Bearer ' + state.token;

  const res = await fetch('/api' + path, { method, headers, body: body ? JSON.stringify(body) : undefined });

  if (res.status === 401 && state.token && auth) {
    window.dispatchEvent(new Event('sesion-expirada'));
    throw new Error('Tu sesión expiró. Ingresa de nuevo.');
  }
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const campos = data.campos ? ': ' + Object.entries(data.campos).map(([k, v]) => `${k} ${v}`).join(', ') : '';
    throw new Error((data.error || 'Error ' + res.status) + campos);
  }
  return data;
}
