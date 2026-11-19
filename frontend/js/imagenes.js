// Foto local según el nombre del producto. Las de picsum no coinciden con lo que se vende.
const POR_NOMBRE = [
  ['audifono', '/img/audifonos.jpg'],
  ['teclado', '/img/teclado.jpg'],
  ['mouse', '/img/mouse.jpg'],
  ['monitor', '/img/monitor.jpg'],
  ['smartwatch', '/img/reloj.jpg'],
  ['reloj', '/img/reloj.jpg'],
  ['cafetera', '/img/cafetera.jpg'],
  ['sabana', '/img/sabanas.jpg'],
  ['lampara', '/img/lampara.jpg'],
  ['baloncesto', '/img/baloncesto.jpg'],
  ['balon', '/img/balon.jpg'],
  ['futbol', '/img/balon.jpg'],
  ['parlante', '/img/parlante.jpg'],
  ['cargador', '/img/powerbank.jpg'],
  ['refriger', '/img/refrigeracion.jpg'],
  ['licuadora', '/img/licuadora.jpg'],
  ['molino', '/img/molino.jpg'],
  ['cuchillo', '/img/cuchillos.jpg'],
  ['silla', '/img/silla.jpg'],
  ['aspiradora', '/img/aspiradora.jpg'],
  ['botella', '/img/botella.jpg'],
  ['gorra', '/img/gorra.jpg'],
  ['gafas', '/img/gafas.jpg'],
  ['camiseta', '/img/camiseta.jpg'],
  ['yoga', '/img/yoga.jpg'],
  ['mancuerna', '/img/pesas.jpg'],
  ['tenis', '/img/tenis.jpg'],
  ['chaqueta', '/img/chaqueta.jpg'],
  ['morral', '/img/morral.jpg'],
];

function normalizar(texto) {
  return (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function fotoDe(producto) {
  const url = producto?.imagenUrl || '';
  if (url.startsWith('/img/')) return url;
  if (url.startsWith('http') && !url.includes('picsum.photos')) return url;
  const nombre = normalizar(producto?.nombre);
  const encontrada = POR_NOMBRE.find(([clave]) => nombre.includes(clave));
  return encontrada ? encontrada[1] : '/img/audifonos.jpg';
}
