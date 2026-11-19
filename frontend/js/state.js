// Estado global de la aplicación
export const state = {
  token: sessionStorage.getItem('token'),
  user: JSON.parse(sessionStorage.getItem('user') || 'null'),
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  page: 0,
  totalPages: 1,
  q: '',
  categoria: '',
  despuesDeLogin: null,
};

export const isAdmin = () => state.user?.rol === 'ADMIN';
