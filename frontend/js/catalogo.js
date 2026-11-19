// Catálogo y pantalla de un producto
import { $, el, money, toast } from './utils.js';
import { state, isAdmin } from './state.js';
import { api } from './api.js';
import { fotoDe } from './imagenes.js';
import { agregarAlCarrito } from './carrito.js';
import { editarProducto, eliminarProducto } from './admin.js';
import { mostrar } from './navegacion.js';

const CATEGORIAS = ['Todas', 'Tecnología', 'Hogar', 'Deportes', 'Moda'];
const MAX_POR_PRODUCTO = 20;

function pintarCategorias() {
  $('#categoryFilters').replaceChildren(...CATEGORIAS.map((c) => el('button', {
    type: 'button',
    class: (state.categoria || 'Todas') === c ? 'active' : '',
    onclick: () => {
      state.categoria = c === 'Todas' ? '' : c;
      state.page = 0;
      pintarCategorias();
      cargarProductos();
    },
  }, c)));
}

function tarjetaProducto(p) {
  const abrir = () => mostrar('product', { id: p.id });
  return el('article', { class: 'card product' },
    el('button', { type: 'button', class: 'product-hit', onclick: abrir },
      el('img', { src: fotoDe(p), alt: p.nombre, loading: 'lazy' }),
      el('h3', {}, p.nombre),
      el('p', { class: 'desc' }, p.descripcion || ''),
      el('p', { class: 'price' }, money(p.precio)),
      el('p', { class: 'stock' + (p.stock ? '' : ' out') }, p.stock ? `${p.stock} disponibles` : 'Agotado')),
    el('div', { class: 'row' },
      el('button', { type: 'button', class: 'primary', onclick: abrir }, 'Ver producto'),
      isAdmin() ? el('button', { type: 'button', onclick: () => editarProducto(p) }, 'Editar') : '',
      isAdmin() ? el('button', { type: 'button', onclick: () => eliminarProducto(p) }, 'Eliminar') : ''));
}

export async function cargarProductos() {
  const params = new URLSearchParams({ page: state.page, size: 12 });
  if (state.q) params.set('q', state.q);
  if (state.categoria) params.set('categoria', state.categoria);
  try {
    const data = await api('/products?' + params, { auth: false });
    state.totalPages = Math.max(data.totalPages ?? data.page?.totalPages ?? 1, 1);
    $('#pageInfo').textContent = `Página ${state.page + 1} de ${state.totalPages}`;
    $('#prevPage').disabled = state.page === 0;
    $('#nextPage').disabled = state.page + 1 >= state.totalPages;
    $('#productGrid').replaceChildren(...(data.content.length
      ? data.content.map(tarjetaProducto)
      : [el('p', { class: 'empty' }, 'No se encontraron productos.')]));
  } catch (err) {
    toast('No se pudo cargar el catálogo: ' + err.message, true);
  }
}

export async function cargarDetalle(id) {
  const caja = $('#productDetail');
  caja.replaceChildren(el('p', {}, 'Cargando producto...'));
  try {
    const p = await api('/products/' + id, { auth: false });
    let cantidad = 1;
    const maximo = Math.min(p.stock || 0, MAX_POR_PRODUCTO);
    const numero = el('span', { class: 'qty-num' }, '1');
    const pintarCantidad = () => { numero.textContent = String(cantidad); };
    const acciones = el('div', { class: 'row' },
      el('button', {
        type: 'button',
        class: 'primary',
        disabled: p.stock ? null : '',
        onclick: () => agregarAlCarrito(p, cantidad),
      }, 'Agregar al carrito'),
      el('button', { type: 'button', onclick: () => mostrar('cart') }, 'Ver carrito'));
    if (isAdmin()) {
      acciones.append(
        el('button', { type: 'button', onclick: () => editarProducto(p) }, 'Editar'),
        el('button', { type: 'button', onclick: () => eliminarProducto(p) }, 'Eliminar'));
    }
    caja.replaceChildren(el('div', { class: 'product-layout' },
      el('img', { src: fotoDe(p), alt: p.nombre }),
      el('div', { class: 'product-info' },
        el('p', { class: 'eyebrow' }, p.categoria),
        el('h2', {}, p.nombre),
        el('p', { class: 'desc' }, p.descripcion || 'Sin descripción.'),
        el('p', { class: 'price' }, money(p.precio)),
        el('p', { class: 'stock' + (p.stock ? '' : ' out') }, p.stock ? `${p.stock} disponibles` : 'Agotado'),
        el('p', { class: 'hint' }, 'Elige cuántas unidades quieres.'),
        el('div', { class: 'qty' },
          el('button', {
            type: 'button',
            'aria-label': 'Disminuir cantidad',
            disabled: p.stock ? null : '',
            onclick: () => { cantidad = Math.max(1, cantidad - 1); pintarCantidad(); },
          }, '−'),
          numero,
          el('button', {
            type: 'button',
            'aria-label': 'Aumentar cantidad',
            disabled: p.stock ? null : '',
            onclick: () => { cantidad = Math.min(Math.max(maximo, 1), cantidad + 1); pintarCantidad(); },
          }, '+')),
        acciones)));
  } catch (err) {
    caja.replaceChildren(el('p', {}, 'No encontramos ese producto. ' + err.message));
  }
}

export function iniciarCatalogo() {
  $('#searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    state.q = $('#searchInput').value.trim();
    state.page = 0;
    mostrar('catalog');
  });
  $('#prevPage').onclick = () => { state.page--; cargarProductos(); };
  $('#nextPage').onclick = () => { state.page++; cargarProductos(); };
  pintarCategorias();
}
