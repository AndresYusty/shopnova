// Carrito y pago, cada uno en su propia pantalla
import { $, el, money, toast } from './utils.js';
import { state } from './state.js';
import { api } from './api.js';
import { fotoDe } from './imagenes.js';
import { abrirLogin } from './auth.js';
import { mostrar } from './navegacion.js';

const MAX_POR_PRODUCTO = 20;
const total = () => state.cart.reduce((s, i) => s + i.precio * i.cantidad, 0);

function franquiciaDe(numero) {
  const n = (numero || '').replace(/\D/g, '');
  if (/^4\d{12}(\d{3}|\d{6})?$/.test(n)) return 'Visa';
  if (n.length === 16) {
    const dos = Number(n.slice(0, 2));
    const cuatro = Number(n.slice(0, 4));
    if ((dos >= 51 && dos <= 55) || (cuatro >= 2221 && cuatro <= 2720)) return 'Mastercard';
  }
  return n.length >= 4 ? 'No reconocida' : '';
}

const ICONO = { Visa: '/img/visa.svg', Mastercard: '/img/mastercard.svg' };

function pintarFranquicia() {
  const marca = $('#cardBrand');
  const icono = $('#cardBrandIcon');
  const tarjeta = $('[name=metodoPago]:checked').value === 'TARJETA';
  const texto = tarjeta ? franquiciaDe($('[name=numeroTarjeta]').value) : '';
  const src = ICONO[texto] || '';
  icono.hidden = !src;
  icono.src = src;
  icono.alt = texto;
  marca.hidden = texto !== 'No reconocida';
  marca.textContent = texto === 'No reconocida' ? 'Tarjeta no reconocida' : '';
}

function guardarCarrito() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
  $('#cartCount').textContent = state.cart.reduce((s, i) => s + i.cantidad, 0);
  pintarCarrito();
}

export function agregarAlCarrito(p, cantidad = 1) {
  const n = Math.max(1, Number(cantidad) || 1);
  const item = state.cart.find((i) => i.productoId === p.id);
  const maximo = Math.min(p.stock ?? item?.stock ?? n, MAX_POR_PRODUCTO);
  const actual = item ? item.cantidad : 0;
  if (!p.stock || actual + n > maximo) return toast('No hay más unidades disponibles', true);
  if (item) {
    item.cantidad += n;
    item.stock = p.stock;
    item.precio = p.precio;
    item.imagen = fotoDe(p);
  } else {
    state.cart.push({
      productoId: p.id,
      nombre: p.nombre,
      precio: p.precio,
      cantidad: n,
      stock: p.stock,
      imagen: fotoDe(p),
    });
  }
  guardarCarrito();
  toast(p.nombre + ' agregado al carrito');
}

function cambiarCantidad(id, delta) {
  const item = state.cart.find((i) => i.productoId === id);
  if (!item) return;
  item.cantidad = Math.min(item.cantidad + delta, Math.min(item.stock, MAX_POR_PRODUCTO));
  if (item.cantidad <= 0) state.cart = state.cart.filter((i) => i.productoId !== id);
  guardarCarrito();
}

function quitar(id) {
  state.cart = state.cart.filter((i) => i.productoId !== id);
  guardarCarrito();
}

export function pintarCarrito() {
  const vacio = !state.cart.length;
  $('#cartItems').replaceChildren(...(vacio
    ? [el('p', { class: 'empty' }, 'Tu carrito está vacío. Elige un producto en el catálogo.')]
    : state.cart.map((i) => el('article', { class: 'cart-item' },
      el('img', { src: i.imagen || fotoDe(i), alt: '' }),
      el('div', {},
        el('strong', {}, i.nombre),
        el('p', { class: 'hint' }, money(i.precio) + ' cada uno')),
      el('div', { class: 'qty' },
        el('button', { type: 'button', 'aria-label': 'Quitar uno', onclick: () => cambiarCantidad(i.productoId, -1) }, '−'),
        el('span', {}, i.cantidad),
        el('button', { type: 'button', 'aria-label': 'Agregar uno', onclick: () => cambiarCantidad(i.productoId, 1) }, '+')),
      el('strong', {}, money(i.precio * i.cantidad)),
      el('button', { type: 'button', class: 'link', onclick: () => quitar(i.productoId) }, 'Quitar')))));
  $('#cartTotal').textContent = money(total());
  const pagar = $('#btnCheckout');
  if (pagar) pagar.disabled = vacio;
}

function pintarResumen() {
  const caja = $('#checkoutSummary');
  if (!caja) return;
  caja.replaceChildren(
    el('h3', {}, 'Resumen del pedido'),
    ...state.cart.map((i) => el('div', { class: 'summary-line' },
      el('span', {}, `${i.cantidad} × ${i.nombre}`),
      el('strong', {}, money(i.precio * i.cantidad)))),
    el('p', { class: 'total' }, 'Total: ', el('strong', {}, money(total()))));
}

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

function cerrarTerminal() {
  $('#payTerminal').hidden = true;
  $('#payWorking').hidden = false;
  $('#payReceipt').hidden = true;
  $('#payReceipt').replaceChildren();
}

function mostrarPaso(texto) {
  $('#payTerminal').hidden = false;
  $('#payWorking').hidden = false;
  $('#payReceipt').hidden = true;
  $('#payStatus').textContent = texto;
}

function mostrarRecibo({ ok, titulo, detalle, monto, marca, ultimos, autorizacion, pedidoId }) {
  $('#payWorking').hidden = true;
  const caja = $('#payReceipt');
  caja.hidden = false;
  const filas = [['Monto', money(monto)]];
  if (pedidoId) filas.unshift(['Pedido', '#' + pedidoId]);
  if (marca) filas.push(['Tarjeta', marca + ' ···· ' + ultimos]);
  if (autorizacion) filas.push(['Autorización', autorizacion]);
  caja.replaceChildren(
    marca && ICONO[marca] ? el('img', { class: 'pay-logo', src: ICONO[marca], alt: marca }) : '',
    el('h2', { class: ok ? 'pay-ok' : 'pay-bad' }, titulo),
    el('p', { class: 'pay-amount' }, money(monto)),
    el('p', {}, detalle),
    el('div', { class: 'pay-meta' }, ...filas.map(([k, v]) =>
      el('div', {}, el('span', {}, k), el('strong', {}, v)))),
    el('div', { class: 'row pay-actions' },
      ok
        ? el('button', { type: 'button', class: 'primary', onclick: () => { cerrarTerminal(); mostrar('orders'); } }, 'Ver mi pedido')
        : el('button', { type: 'button', class: 'primary', onclick: cerrarTerminal }, 'Intentar con otra tarjeta'),
      el('button', { type: 'button', onclick: () => { cerrarTerminal(); mostrar(ok ? 'catalog' : 'checkout'); } }, ok ? 'Seguir comprando' : 'Volver')));
}

export function prepararCheckout() {
  cerrarTerminal();
  $('#checkoutError').textContent = '';
  $('#checkoutTotal').textContent = money(total());
  const esTarjeta = $('[name=metodoPago]:checked').value === 'TARJETA';
  $('#cardLabel').hidden = !esTarjeta;
  pintarFranquicia();
  pintarResumen();
}

async function pagar(e) {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const numero = (f.numeroTarjeta || '').replace(/\D/g, '');
  const marca = franquiciaDe(numero);
  const conTarjeta = f.metodoPago === 'TARJETA';
  if (conTarjeta && marca !== 'Visa' && marca !== 'Mastercard') {
    $('#checkoutError').textContent = 'Solo aceptamos Visa o Mastercard';
    return;
  }
  if (!$('#payTerminal').hidden) return;
  const boton = e.target.querySelector('[type=submit]');
  const monto = total();
  boton.disabled = true;
  $('#checkoutError').textContent = '';
  try {
    mostrarPaso(conTarjeta ? 'Conectando con el banco…' : 'Confirmando el pedido…');
    await esperar(900);
    mostrarPaso(conTarjeta ? 'Verificando ' + marca + ' ···· ' + numero.slice(-4) : 'Reservando los productos…');
    await esperar(800);
    const pedido = await api('/orders', {
      method: 'POST',
      body: {
        items: state.cart.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
        metodoPago: f.metodoPago,
        numeroTarjeta: conTarjeta ? numero : null,
        direccionEnvio: f.direccionEnvio,
      },
    });
    mostrarPaso(conTarjeta ? 'Autorizando el cobro…' : 'Registrando el pago contra entrega…');
    await esperar(600);
    state.cart = [];
    guardarCarrito();
    e.target.reset();
    pintarFranquicia();
    mostrarRecibo({
      ok: true,
      titulo: conTarjeta ? 'Pago aprobado' : 'Pedido confirmado',
      detalle: conTarjeta ? 'El banco autorizó el cobro.' : 'Pagarás al recibir el paquete.',
      monto: pedido.total,
      marca: conTarjeta ? (pedido.franquicia || marca) : '',
      ultimos: conTarjeta ? numero.slice(-4) : '',
      autorizacion: pedido.transaccionId,
      pedidoId: pedido.id,
    });
  } catch (err) {
    if ((err.message || '').includes('sesión expiró')) {
      cerrarTerminal();
      state.despuesDeLogin = 'checkout';
      abrirLogin(false);
      return;
    }
    mostrarRecibo({
      ok: false,
      titulo: 'Pago rechazado',
      detalle: err.message || 'El banco no autorizó la transacción.',
      monto,
      marca: conTarjeta ? marca : '',
      ultimos: conTarjeta ? numero.slice(-4) : '',
      pedidoId: '',
    });
  } finally {
    boton.disabled = false;
  }
}

export function iniciarCarrito() {
  $('#btnCheckout').onclick = () => {
    if (!state.token) {
      state.despuesDeLogin = 'checkout';
      toast('Ingresa para finalizar tu compra');
      return abrirLogin(false);
    }
    mostrar('checkout');
  };
  document.querySelectorAll('[name=metodoPago]').forEach((r) => r.addEventListener('change', () => {
    const esTarjeta = $('[name=metodoPago]:checked').value === 'TARJETA';
    $('#cardLabel').hidden = !esTarjeta;
    pintarFranquicia();
  }));
  $('[name=numeroTarjeta]').addEventListener('input', pintarFranquicia);
  $('#checkoutForm').addEventListener('submit', pagar);
  guardarCarrito();
}
