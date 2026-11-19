// "Mis pedidos" del cliente y tarjeta de pedido reutilizada por el panel de administración
import { $, el, money, toast } from './utils.js';
import { api } from './api.js';

const SIGUIENTES = { PAGADO: ['ENVIADO', 'CANCELADO'], ENVIADO: ['ENTREGADO'] };

export function tarjetaPedido(o, { admin = false, alCambiar } = {}) {
  const acciones = el('div', { class: 'row' });
  if (admin) {
    (SIGUIENTES[o.estado] || []).forEach((s) => acciones.append(el('button', { onclick: () => cambiarEstado(o.id, s, alCambiar) }, '→ ' + s)));
  } else if (o.estado === 'PAGADO') {
    acciones.append(el('button', { onclick: () => cambiarEstado(o.id, 'CANCELADO', alCambiar) }, 'Cancelar pedido'));
  }
  return el('div', { class: 'card order' },
    el('div', { class: 'order-head' },
      el('strong', {}, `Pedido #${o.id}`),
      el('span', { class: 'badge ' + o.estado }, o.estado),
      el('span', {}, new Date(o.fecha).toLocaleString('es-CO')),
      el('strong', {}, money(o.total))),
    el('ul', {}, o.items.map((i) => el('li', {}, `${i.cantidad} × ${i.producto} — ${money(i.subtotal)}`))),
    el('p', { class: 'hint' }, `Pago: ${o.franquicia || (o.metodoPago === 'CONTRAENTREGA' ? 'Contra entrega' : 'Tarjeta')} · Transacción: ${o.transaccionId || '-'} · Envío: ${o.direccionEnvio}`),
    acciones);
}

async function cambiarEstado(id, estado, alCambiar) {
  if (!confirm(`¿Cambiar el pedido #${id} a ${estado}?`)) return;
  try {
    await api(`/orders/${id}/status`, { method: 'PATCH', body: { estado } });
    toast('Pedido actualizado');
    alCambiar?.();
  } catch (err) {
    toast(err.message, true);
  }
}

export async function cargarMisPedidos() {
  try {
    const lista = await api('/orders/mine');
    $('#ordersList').replaceChildren(...(lista.length
      ? lista.map((o) => tarjetaPedido(o, { alCambiar: cargarMisPedidos }))
      : [el('p', {}, 'Aún no tienes pedidos.')]));
  } catch (err) {
    toast(err.message, true);
  }
}
