// Widget del asistente virtual (chatbot)
import { $, el } from './utils.js';
import { api } from './api.js';

function agregarMensaje(texto, quien) {
  const caja = $('#chatMessages');
  caja.append(el('div', { class: 'msg ' + quien }, texto));
  caja.scrollTop = caja.scrollHeight;
}

function pintarOpciones(opciones) {
  $('#chatOptions').replaceChildren(...(opciones || []).map((o) =>
    el('button', { type: 'button', onclick: () => enviar(o) }, o)));
}

const historial = [];

async function enviar(texto) {
  const limpio = texto.trim();
  if (!limpio) return;
  agregarMensaje(limpio, 'user');
  pintarOpciones([]);
  const contexto = historial.slice(-6).map((h) => h.quien + ': ' + h.texto).join('\n');
  historial.push({ quien: 'Usuario', texto: limpio });
  try {
    const r = await api('/chat', { method: 'POST', body: { mensaje: limpio, contexto } });
    agregarMensaje(r.respuesta, 'bot');
    historial.push({ quien: 'Nova', texto: r.respuesta });
    pintarOpciones(r.opciones);
  } catch {
    agregarMensaje('Lo siento, no pude responder en este momento.', 'bot');
  }
}

function ponerChat(abierto) {
  $('#chatBox').hidden = !abierto;
  $('#chatToggle').hidden = abierto;
  if (abierto) $('#chatInput').focus();
}

async function abrirCerrar() {
  ponerChat(true);
  if (!$('#chatMessages').children.length) {
    try {
      const r = await api('/chat/menu', { auth: false });
      agregarMensaje(r.respuesta, 'bot');
      historial.push({ quien: 'Nova', texto: r.respuesta });
      pintarOpciones(r.opciones);
    } catch {
      agregarMensaje('El asistente no está disponible.', 'bot');
    }
  }
}

export function iniciarChat() {
  $('#chatToggle').onclick = abrirCerrar;
  $('#chatClose').onclick = () => ponerChat(false);
  $('#chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = $('#chatInput').value;
    $('#chatInput').value = '';
    enviar(texto);
  });
}
