// Cada flujo es una pantalla distinta: catálogo, producto, carrito, pago, cuenta, pedidos y admin.
import { state, isAdmin } from './state.js';
import { cargarProductos, cargarDetalle } from './catalogo.js';
import { pintarCarrito, prepararCheckout } from './carrito.js';
import { cargarMisPedidos } from './pedidos.js';
import { cargarPedidosAdmin } from './admin.js';
import { prepararAuth } from './auth.js';

const HASH = {
  catalog: 'catalogo',
  product: 'producto',
  cart: 'carrito',
  checkout: 'pago',
  auth: 'cuenta',
  orders: 'pedidos',
  admin: 'admin',
};

let silencioso = false;

function hashDe(vista, params) {
  if (vista === 'product') return `producto/${params.id}`;
  if (vista === 'auth' && params.registro) return 'cuenta/registro';
  return HASH[vista] || 'catalogo';
}

function parse(hash) {
  const partes = (hash || '').replace(/^#/, '').split('/').filter(Boolean);
  const ruta = partes[0] || 'catalogo';
  const vista = Object.keys(HASH).find((k) => HASH[k] === ruta) || 'catalog';
  if (vista === 'product') return { vista, params: { id: partes[1] } };
  if (vista === 'auth') return { vista, params: { registro: partes[1] === 'registro' } };
  return { vista, params: {} };
}

function resolver(vista, params) {
  if (vista === 'admin' && !isAdmin()) return { vista: 'catalog', params: {} };
  if ((vista === 'orders' || vista === 'checkout') && !state.token) {
    state.despuesDeLogin = vista;
    return { vista: 'auth', params: {} };
  }
  if (vista === 'checkout' && !state.cart.length) return { vista: 'cart', params: {} };
  return { vista, params: params || {} };
}

function pintar(vista, params) {
  document.querySelectorAll('.view').forEach((v) => { v.hidden = v.id !== 'view-' + vista; });
  document.querySelectorAll('.nav [data-view], #btnCart').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === vista);
  });
  window.scrollTo(0, 0);
  if (vista === 'catalog') cargarProductos();
  if (vista === 'product') cargarDetalle(params.id);
  if (vista === 'cart') pintarCarrito();
  if (vista === 'checkout') prepararCheckout();
  if (vista === 'orders') cargarMisPedidos();
  if (vista === 'admin') cargarPedidosAdmin();
  if (vista === 'auth') prepararAuth(!!params.registro);
}

export function mostrar(vista, params = {}) {
  const destino = resolver(vista, params);
  pintar(destino.vista, destino.params);
  const hash = '#' + hashDe(destino.vista, destino.params);
  if (location.hash !== hash) {
    silencioso = true;
    location.hash = hash;
  }
}

function alCambiarHash() {
  if (silencioso) {
    silencioso = false;
    return;
  }
  const leido = parse(location.hash);
  mostrar(leido.vista, leido.params);
}

export function iniciarNavegacion() {
  document.querySelectorAll('[data-view]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      mostrar(b.dataset.view);
    }));
  window.addEventListener('hashchange', alCambiarHash);
}

export function arrancar() {
  if (!location.hash) mostrar('catalog');
  else alCambiarHash();
}
