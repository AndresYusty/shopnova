// Inicio de sesión y registro, en su propia pantalla
import { $, toast } from './utils.js';
import { state, isAdmin } from './state.js';
import { api } from './api.js';
import { mostrar } from './navegacion.js';

let modoRegistro = false;

export function pintarSesion() {
  const logueado = !!state.token;
  $('#btnLogin').hidden = logueado;
  $('#userBox').hidden = !logueado;
  $('#navOrders').hidden = !logueado;
  $('#navAdmin').hidden = !(logueado && isAdmin());
  $('#userName').textContent = state.user ? state.user.nombre : '';
}

function guardarSesion(data) {
  state.token = data.token;
  state.user = data.usuario;
  sessionStorage.setItem('token', data.token);
  sessionStorage.setItem('user', JSON.stringify(data.usuario));
  pintarSesion();
}

export function cerrarSesion() {
  state.token = null;
  state.user = null;
  state.despuesDeLogin = null;
  sessionStorage.clear();
  pintarSesion();
  mostrar('catalog');
}

export function prepararAuth(registro = false) {
  modoRegistro = registro;
  $('#authTitle').textContent = registro ? 'Crear cuenta' : 'Ingresar';
  $('#authSubmit').textContent = registro ? 'Registrarme' : 'Ingresar';
  $('#authSwitch').textContent = registro ? '¿Ya tienes cuenta? Ingresar' : '¿No tienes cuenta? Crear cuenta';
  $('#nameLabel').hidden = !registro;
  $('#pwdHint').hidden = !registro;
  $('#authForm [name=nombre]').required = registro;
  $('#authError').textContent = '';
}

export function abrirLogin(registro = false) {
  mostrar('auth', { registro });
}

export function iniciarAuth() {
  $('#btnLogout').onclick = cerrarSesion;
  $('#authCancel').onclick = () => {
    state.despuesDeLogin = null;
    mostrar('catalog');
  };
  $('#authSwitch').onclick = () => mostrar('auth', { registro: !modoRegistro });
  window.addEventListener('sesion-expirada', cerrarSesion);

  $('#authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try {
      const data = modoRegistro
        ? await api('/auth/register', { method: 'POST', body: f, auth: false })
        : await api('/auth/login', { method: 'POST', body: { email: f.email, password: f.password }, auth: false });
      guardarSesion(data);
      e.target.reset();
      toast('¡Bienvenido, ' + data.usuario.nombre + '!');
      const siguiente = state.despuesDeLogin;
      state.despuesDeLogin = null;
      mostrar(siguiente || 'catalog');
    } catch (err) {
      $('#authError').textContent = err.message;
    }
  });

  pintarSesion();
}
