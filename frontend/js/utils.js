// Utilidades generales de la interfaz
export const $ = (selector) => document.querySelector(selector);

export const money = (valor) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);

// Crea elementos HTML de forma segura (usa textContent, nunca innerHTML: evita XSS)
export function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) e.setAttribute(k, v);
  });
  children.flat().forEach((c) => e.append(c instanceof Node ? c : document.createTextNode(String(c))));
  return e;
}

// Mensaje emergente en la parte inferior
export function toast(mensaje, error = false) {
  const t = $('#toast');
  t.textContent = mensaje;
  t.className = 'toast' + (error ? ' err' : '');
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 3500);
}
