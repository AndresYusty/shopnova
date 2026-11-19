// Punto de entrada: inicializa cada módulo de la tienda
import { iniciarNavegacion, arrancar } from './navegacion.js';
import { iniciarAuth } from './auth.js';
import { iniciarCatalogo } from './catalogo.js';
import { iniciarCarrito } from './carrito.js';
import { iniciarAdmin } from './admin.js';
import { iniciarChat } from './chat.js';

iniciarNavegacion();
iniciarAuth();
iniciarCatalogo();
iniciarCarrito();
iniciarAdmin();
iniciarChat();
arrancar();
