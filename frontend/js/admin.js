// Panel de administración: productos y pedidos
import { $, el, toast } from './utils.js';
import { api } from './api.js';
import { tarjetaPedido } from './pedidos.js';
import { mostrar } from './navegacion.js';

const CAMPOS = ['id', 'nombre', 'descripcion', 'precio', 'stock', 'categoria', 'imagenUrl'];

export async function cargarPedidosAdmin() {
  try {
    const lista = await api('/orders');
    $('#adminOrders').replaceChildren(...(lista.length
      ? lista.map((o) => tarjetaPedido(o, { admin: true, alCambiar: cargarPedidosAdmin }))
      : [el('p', {}, 'Sin pedidos.')]));
  } catch (err) {
    toast(err.message, true);
  }
}

export function editarProducto(p) {
  mostrar('admin');
  const f = $('#productForm');
  CAMPOS.forEach((k) => (f.elements[k].value = p[k] ?? ''));
  $('#productFormTitle').textContent = 'Editar producto #' + p.id;
}

export async function eliminarProducto(p) {
  if (!confirm('¿Eliminar ' + p.nombre + '?')) return;
  try {
    await api('/products/' + p.id, { method: 'DELETE' });
    toast('Producto eliminado');
    mostrar('catalog');
  } catch (err) {
    toast(err.message, true);
  }
}

function limpiarFormulario() {
  $('#productFormTitle').textContent = 'Nuevo producto';
  $('#productForm').elements.id.value = '';
}

export function iniciarAdmin() {
  $('#resetProduct').onclick = limpiarFormulario;
  $('#productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { id, ...producto } = Object.fromEntries(new FormData(e.target));
    producto.precio = Number(producto.precio);
    producto.stock = Number(producto.stock);
    try {
      await api(id ? '/products/' + id : '/products', { method: id ? 'PUT' : 'POST', body: producto });
      toast('Producto guardado');
      e.target.reset();
      limpiarFormulario();
    } catch (err) {
      toast(err.message, true);
    }
  });
}
