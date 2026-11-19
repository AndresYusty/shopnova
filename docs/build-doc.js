// Genera docs/ShopNova-Documentacion-Proyecto-Final.docx
const fs = require('fs');
const path = require('path');
const sharp = require('/opt/npm-tools/node_modules/sharp');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, ImageRun, PageBreak, TableOfContents, LevelFormat,
  Footer, PageNumber, Header,
} = require('docx');

const D = __dirname;
const FONT = 'Calibri';
const W = 9360; // ancho útil (Carta, márgenes de 1")
const PRI = '3730A3';

// ---------- ayudantes ----------
const P = (text, o = {}) => new Paragraph({
  spacing: { after: 120, line: 276 }, alignment: o.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
  children: runs(text, o),
});
function runs(text, o = {}) {
  if (!o.keepN) lastN = false;
  // **negrita** soportada
  return String(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((t) => t.startsWith('**')
    ? new TextRun({ text: t.slice(2, -2), bold: true, font: FONT, size: o.size || 22, color: o.color })
    : new TextRun({ text: t, font: FONT, size: o.size || 22, italics: o.italics, color: o.color, bold: o.bold }));
}
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun(t)] });
const H2 = (t) => (lastN = false, new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] }));
const H3 = (t) => (lastN = false, new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] }));
const B = (t, level = 0) => new Paragraph({ numbering: { reference: 'bul', level }, spacing: { after: 60 }, children: runs(t) });
let numInst = 0, lastN = false;
const N = (t) => { if (!lastN) numInst++; lastN = true; const par = new Paragraph({ numbering: { reference: 'num', level: 0, instance: numInst }, spacing: { after: 60 }, children: runs(t, { keepN: true }) }); return par; };
const NOTE = (t) => new Paragraph({
  spacing: { before: 80, after: 160 }, shading: { type: ShadingType.CLEAR, fill: 'EEF2FF' },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: '4F46E5', space: 6 } },
  children: runs(t, { size: 20 }),
});
const CODE = (lines) => lines.map((l) => new Paragraph({
  spacing: { after: 0 }, shading: { type: ShadingType.CLEAR, fill: 'F3F4F6' },
  children: [new TextRun({ text: l || ' ', font: 'Consolas', size: 18 })],
}));
const CAP = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: t, italics: true, size: 18, font: FONT, color: '555555' })] });

const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const borders = { top: border, bottom: border, left: border, right: border };
function T(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const ws = widths.map((w) => Math.floor((w / total) * W));
  ws[ws.length - 1] += W - ws.reduce((a, b) => a + b, 0);
  const cell = (text, i, head) => new TableCell({
    borders, width: { size: ws[i], type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, fill: PRI } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: String(text).split('\n').map((line) => new Paragraph({
      spacing: { after: 0 },
      children: head ? [new TextRun({ text: line, bold: true, color: 'FFFFFF', font: FONT, size: 19 })] : runs(line, { size: 19 }),
    })),
  });
  return new Table({
    width: { size: W, type: WidthType.DXA }, columnWidths: ws,
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, i, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, i, false)) }))],
  });
}
const SP = () => new Paragraph({ spacing: { after: 120 }, children: [] });

const imgs = {};
async function loadImg(rel, maxW = 600, maxH = 640) {
  const file = path.join(D, rel);
  const m = await sharp(file).metadata();
  const s = Math.min(maxW / m.width, maxH / m.height, 1);
  imgs[rel] = { data: fs.readFileSync(file), w: Math.round(m.width * s), h: Math.round(m.height * s) };
}
const IMG = (rel) => (lastN = false, new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
  children: [new ImageRun({ type: 'png', data: imgs[rel].data, transformation: { width: imgs[rel].w, height: imgs[rel].h } })],
}));

(async () => {
  const diagramas = ['c4-contexto', 'c4-contenedores', 'c4-componentes', 'secuencia-compra', 'er', 'chatbot-arbol', 'despliegue'];
  for (const d of diagramas) await loadImg(`diagramas/${d}.png`, 600, 620);
  for (const f of fs.readdirSync(path.join(D, 'capturas'))) await loadImg(`capturas/${f}`, 560, 400);

  const PEND = 'Pendiente (diligenciar tras ejecutar)';
  const c = [];

  // ================= PORTADA =================
  c.push(new Paragraph({ spacing: { before: 2400 }, children: [] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ShopNova', bold: true, size: 72, color: PRI, font: FONT })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'Plataforma de e-commerce distribuida e inteligente', size: 32, font: FONT })] }),
    P('Arquitectura, implementación, pruebas de calidad y despliegue de un sistema distribuido con asistente conversacional', { center: true, italics: true }),
    new Paragraph({ spacing: { before: 1600 }, children: [] }),
    P('**Trabajo final - Ingeniería de Software II**', { center: true }),
    P('Integrante(s): Alejandro Cardoso Parra', { center: true }),
    P('Docente: ______________________________', { center: true }),
    P('Institución: ______________________________', { center: true }),
    P('Noviembre de 2026', { center: true }),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ children: [new TextRun({ text: 'Contenido', bold: true, size: 32, font: FONT, color: PRI })] }),
    new TableOfContents('Contenido', { hyperlink: true, headingStyleRange: '1-2' }),
    NOTE('Si la tabla de contenido aparece vacía, en Word haga clic derecho sobre ella y elija "Actualizar campo".'));

  // ================= 1. INTRODUCCIÓN =================
  c.push(H1('1. Introducción'),
    H2('1.1 Escenario seleccionado'),
    P('El equipo seleccionó el escenario de un **e-commerce de alta concurrencia**. ShopNova es una tienda en línea colombiana que vende tecnología, artículos para el hogar, deportes y moda. En temporadas como el Black Friday el tráfico se multiplica, así que el sistema debe soportar muchos usuarios al mismo tiempo, no vender productos sin stock y seguir funcionando aunque falle alguna de sus partes.'),
    H2('1.2 Objetivo general'),
    P('Diseñar, construir, integrar y validar un sistema de software distribuido de alta disponibilidad que incorpore un asistente conversacional y que se someta a pruebas de rendimiento, seguridad y usabilidad.'),
    H2('1.3 Objetivos específicos'),
    B('Modelar la arquitectura con el modelo C4 y definir la descomposición en microservicios, su comunicación y su persistencia (Fase 1).'),
    B('Implementar un MVP funcional con patrones de diseño, ORM, JWT y la integración de una pasarela de pagos y de notificaciones (Fase 2).'),
    B('Integrar un asistente virtual basado en reglas conectado al backend (Fase 3).'),
    B('Ejecutar pruebas de carga, estrés, seguridad (OWASP Top 10) y usabilidad, y proponer un plan de mitigación (Fase 4).'),
    B('Contenerizar y desplegar la solución, y validarla con pruebas de aceptación End-to-End (Fase 5).'),
    H2('1.4 Alcance del MVP'),
    T(['Incluido', 'Fuera del alcance'], [
      ['Registro e inicio de sesión de clientes, rol administrador', 'Recuperación de contraseña por correo'],
      ['Catálogo con búsqueda, filtros por categoría y paginación', 'Reseñas y calificaciones de productos'],
      ['Carrito, checkout y pago (pasarela simulada tipo sandbox)', 'Integración con una pasarela real en producción'],
      ['Seguimiento y cancelación de pedidos', 'Facturación electrónica DIAN'],
      ['Notificaciones por correo con mensajería asíncrona', 'Notificaciones push / SMS'],
      ['Asistente virtual con reglas y consultas en vivo al backend', 'Modelo de lenguaje (IA generativa)'],
      ['Panel de administración de productos y pedidos', 'Reportes de ventas'],
    ], [1, 1]));

  // ================= 2. FASE 1 =================
  c.push(H1('2. Fase 1 - Análisis y diseño arquitectónico'),
    H2('2.1 Requisitos funcionales'),
    T(['ID', 'Requisito', 'Servicio'], [
      ['RF-01', 'Registrar clientes e iniciar sesión con correo y contraseña', 'auth-service'],
      ['RF-02', 'Listar, buscar y filtrar productos por categoría', 'catalog-service'],
      ['RF-03', 'Crear, editar y eliminar productos (solo administrador)', 'catalog-service'],
      ['RF-04', 'Crear un pedido a partir del carrito y pagarlo', 'order-service'],
      ['RF-05', 'Descontar el inventario al comprar y devolverlo si el pedido falla o se cancela', 'catalog + order'],
      ['RF-06', 'Consultar "Mis pedidos" y cancelar un pedido aún no enviado', 'order-service'],
      ['RF-07', 'Cambiar el estado de los pedidos (enviado, entregado) como administrador', 'order-service'],
      ['RF-08', 'Enviar un correo al confirmar un pedido o al cambiar su estado', 'notification-service'],
      ['RF-09', 'Responder preguntas frecuentes y consultar pedidos y productos con un asistente virtual', 'chatbot-service'],
    ], [1, 6, 2]),
    SP(),
    H2('2.2 Atributos de calidad (requisitos no funcionales)'),
    T(['Atributo', 'Escenario / métrica objetivo', 'Táctica arquitectónica'], [
      ['Rendimiento', 'p95 < 800 ms con 50 usuarios concurrentes; crear pedido p95 < 1,5 s', 'Servicios stateless, índices, paginación, pool de conexiones'],
      ['Escalabilidad', 'Duplicar la capacidad agregando réplicas de un servicio', 'Servicios sin estado + JWT; gateway como balanceador'],
      ['Disponibilidad', 'Si falla el correo o RabbitMQ, igual se pueden comprar productos', 'Mensajería asíncrona, timeouts, reintentos, Dead Letter Queue'],
      ['Consistencia', 'Nunca vender más unidades que el stock existente', 'Bloqueo pesimista + Saga con compensación'],
      ['Seguridad', 'Cumplir los controles de OWASP Top 10 aplicables', 'JWT, BCrypt, validación, roles, rate limiting, cabeceras'],
      ['Usabilidad', 'Un cliente nuevo compra en menos de 3 minutos sin ayuda', 'Interfaz simple, mensajes claros, asistente virtual'],
      ['Mantenibilidad', 'Cada servicio se despliega de forma independiente', 'Microservicios con tablas separadas por servicio, Docker'],
    ], [2, 4, 4]),
    H2('2.3 Modelo C4 - Nivel 1: diagrama de contexto'),
    P('El diagrama de contexto muestra a ShopNova como una caja negra, a sus usuarios (cliente y administrador) y a los sistemas externos con los que se integra: la pasarela de pagos y el servidor de correo.'),
    IMG('diagramas/c4-contexto.png'), CAP('Figura 1. Diagrama de contexto (C4 nivel 1)'),
    H2('2.4 Modelo C4 - Nivel 2: diagrama de contenedores'),
    P('El sistema se descompone en un contenedor frontend (Nginx, que también funciona como API Gateway), cinco microservicios Spring Boot, un broker de mensajes y una base de datos MySQL. Las flechas continuas son comunicación síncrona (HTTP/REST) y las punteadas, asíncrona (AMQP).'),
    IMG('diagramas/c4-contenedores.png'), CAP('Figura 2. Diagrama de contenedores (C4 nivel 2)'),
    H2('2.5 Modelo C4 - Nivel 3: componentes de order-service'),
    P('order-service es el servicio más complejo porque orquesta la compra. Internamente sigue una arquitectura por capas: controlador, servicio de aplicación, repositorio y adaptadores hacia otros sistemas.'),
    IMG('diagramas/c4-componentes.png'), CAP('Figura 3. Componentes de order-service (C4 nivel 3)'),
    H2('2.6 Descomposición en servicios'),
    P('La división se hizo por **capacidades de negocio** (Domain-Driven Design): cada servicio se encarga de un contexto delimitado y de sus propias tablas.'),
    T(['Servicio', 'Responsabilidad', 'Tablas que maneja', 'Se comunica con'], [
      ['frontend (Nginx)', 'Sirve la tienda y actúa como API Gateway: enruta /api/*, limita peticiones', '—', 'Todos los servicios con API pública'],
      ['auth-service', 'Identidad: registro, login, emisión de JWT', 'usuarios', '—'],
      ['catalog-service', 'Productos, búsqueda e inventario', 'productos', '—'],
      ['order-service', 'Pedidos, pago y estados', 'pedidos, items_pedido', 'catalog (REST), RabbitMQ'],
      ['notification-service', 'Correos al cliente', 'Ninguna (stateless)', 'RabbitMQ, SMTP'],
      ['chatbot-service', 'Asistente virtual por reglas', 'Ninguna (stateless)', 'catalog y order (REST)'],
    ], [2, 4, 2.5, 2.5]),
    SP(),
    H2('2.7 Comunicación síncrona y asíncrona'),
    H3('Comunicación síncrona (REST/JSON)'),
    B('**Cliente → Gateway → servicio:** todas las peticiones del navegador pasan por Nginx.'),
    B('**order-service → catalog-service:** al comprar, el pedido necesita saber si hay stock en ese mismo momento, así que se usa una llamada síncrona a los endpoints internos /internal/products/{id}/reserve y /release, protegidos con la cabecera X-Internal-Key. Tiene timeouts de 2 s (conexión) y 5 s (lectura).'),
    B('**chatbot-service → catalog / order:** consulta productos y el estado de los pedidos reenviando el JWT del usuario.'),
    H3('Comunicación asíncrona (RabbitMQ)'),
    P('Enviar un correo es lento y puede fallar, pero no debe bloquear ni arruinar una compra. Por eso order-service **publica un evento** y continúa; notification-service lo consume después.'),
    T(['Elemento', 'Valor'], [
      ['Exchange', 'shopnova.events (tipo topic, durable)'],
      ['Routing keys', 'order.created (pedido confirmado) · order.status (cambio de estado)'],
      ['Cola', 'notifications.orders (binding order.*)'],
      ['Tolerancia a fallos', '3 reintentos con espera de 2 s; luego el mensaje pasa a notifications.orders.dlq'],
      ['Formato del mensaje', 'JSON: tipo, pedidoId, usuarioId, email, estado, total, items[], fecha'],
    ], [1, 3]),
    SP(),
    IMG('diagramas/secuencia-compra.png'), CAP('Figura 4. Secuencia de una compra: llamadas síncronas, pago, evento asíncrono y compensación'),
    H2('2.8 Estrategia de persistencia'),
    P('Se usa **una sola base de datos MySQL (shopnova_db)** compartida por los microservicios. Se eligió así para mantener el proyecto simple: un único script, una única conexión que administrar y menos consumo de recursos. Para no perder el orden de la arquitectura distribuida, **cada servicio administra solo sus propias tablas** mediante JPA/Hibernate: auth-service maneja usuarios, catalog-service maneja productos y order-service maneja pedidos e items_pedido. Ningún servicio escribe en las tablas de otro. Cuando order-service necesita el stock, se lo pide a catalog-service por REST en lugar de modificar la tabla productos directamente.'),
    P('Como cada servicio solo conoce sus tablas, las columnas pedidos.usuario_id e items_pedido.producto_id guardan el id del usuario y del producto sin llave foránea hacia tablas de otro servicio. Además, el pedido guarda una copia del nombre y del precio del producto al momento de la compra, para que el historial no cambie si después se modifica el catálogo. Si el sistema creciera, cada grupo de tablas se podría mover a su propia base de datos cambiando solo la variable DB_URL del servicio.'),
    IMG('diagramas/er.png'), CAP('Figura 5. Modelo de datos de shopnova_db (las líneas punteadas relacionan tablas de servicios distintos por id, sin llave foránea)'),
    P('**Consistencia entre servicios.** Aunque la base de datos es una sola, cada servicio maneja sus propias transacciones, así que no existe una transacción que abarque varios servicios. Por eso, la compra usa una **Saga orquestada**: order-service reserva el stock, cobra y guarda el pedido. Si el pago falla, ejecuta la acción compensatoria (liberar el stock). Para evitar la sobreventa cuando muchos usuarios compran el mismo producto, la reserva usa **bloqueo pesimista** (SELECT ... FOR UPDATE), y el producto tiene además una columna version (bloqueo optimista) para las ediciones concurrentes del administrador.'),
    H2('2.9 Decisiones arquitectónicas (ADR)'),
    T(['Decisión', 'Alternativas evaluadas', 'Justificación'], [
      ['Microservicios', 'Monolito modular', 'Escalar por separado el catálogo (más leído) y los pedidos; despliegues independientes'],
      ['JWT stateless (HS256)', 'Sesiones en servidor, OAuth2/Keycloak', 'Cualquier réplica valida el token sin estado compartido; Keycloak es demasiado para un MVP'],
      ['RabbitMQ', 'Kafka, llamadas REST directas', 'Liviano, colas con reintentos y DLQ; Kafka sobra para este volumen'],
      ['Nginx como API Gateway', 'Spring Cloud Gateway', 'Menos memoria; sirve el frontend y aplica rate limiting y cabeceras'],
      ['Una sola BD MySQL compartida, tablas separadas por servicio', 'Una BD por servicio (Database per Service)', 'Más simple de instalar, respaldar y administrar en un MVP; la separación de tablas permite dividirla después'],
      ['MySQL + JPA/Hibernate', 'PostgreSQL, MongoDB', 'Datos transaccionales y relacionales; tecnología conocida por el equipo'],
      ['Chatbot por reglas', 'API de IA generativa', 'Respuestas deterministas, sin costo ni alucinaciones; ampliable a IA después'],
    ], [2, 2.5, 5]));

  // ================= 3. FASE 2 =================
  c.push(H1('3. Fase 2 - Construcción del núcleo'),
    H2('3.1 Stack tecnológico'),
    T(['Capa', 'Tecnología'], [
      ['Backend', 'Java 17, Spring Boot 3.3 (Web, Data JPA, Security, Validation, AMQP, Mail, Actuator)'],
      ['ORM / BD', 'Hibernate 6 + MySQL 8.4'],
      ['Seguridad', 'Spring Security 6, JJWT 0.12 (JWT HS256), BCrypt'],
      ['Mensajería', 'RabbitMQ 3.13'],
      ['Documentación API', 'springdoc-openapi 2.6 (Swagger UI)'],
      ['Frontend', 'HTML5, CSS3 y JavaScript sin frameworks (SPA con módulos ES: un archivo por funcionalidad)'],
      ['Infraestructura', 'Docker, Docker Compose, Nginx 1.27, Mailpit'],
      ['Pruebas', 'JUnit 5 + Mockito, k6, scripts Node.js (E2E y seguridad), OWASP ZAP'],
    ], [1, 4]),
    SP(),
    H2('3.2 Patrones de diseño aplicados'),
    T(['Patrón', 'Dónde', 'Para qué'], [
      ['API Gateway', 'frontend/nginx.conf', 'Un único punto de entrada; oculta la topología interna'],
      ['Base de datos compartida con propiedad de tablas', 'backend/database/init.sql', 'Simplicidad; cada servicio solo accede a sus tablas'],
      ['Saga orquestada + compensación', 'PedidoService.crear()', 'Consistencia sin transacciones distribuidas'],
      ['Publish/Subscribe', 'EventPublisher / NotificationListener', 'Desacoplar pedidos de notificaciones'],
      ['Repository', '*Repository (Spring Data JPA)', 'Abstraer el acceso a datos'],
      ['DTO', 'paquetes web.dto (records)', 'No exponer entidades JPA; validar entradas'],
      ['Strategy / Adapter (puertos)', 'PaymentGateway, Lookups del chatbot', 'Cambiar la pasarela simulada por una real sin tocar la lógica'],
      ['State', 'EstadoPedido.puedePasarA()', 'Controlar las transiciones válidas del pedido'],
      ['Chain of Responsibility', 'Reglas de ChatbotEngine', 'Evaluar reglas en orden hasta que una responda'],
      ['Filter / Interceptor', 'JwtAuthFilter', 'Autenticación transversal'],
    ], [2.5, 3, 4]),
    SP(),
    H2('3.3 Manejo seguro de sesiones con JWT'),
    N('El usuario envía su correo y contraseña a POST /api/auth/login.'),
    N('auth-service compara la contraseña con el hash BCrypt (costo 10) y emite un JWT firmado con HMAC-SHA256 que dura 1 hora. Contiene el correo (sub), el id (uid), el rol (rol), el emisor y la fecha de expiración.'),
    N('El frontend guarda el token en sessionStorage, que se borra al cerrar la pestaña, y lo envía en la cabecera Authorization: Bearer.'),
    N('Cada microservicio valida la firma con el secreto compartido (JWT_SECRET, mínimo 32 caracteres) sin consultar a auth-service. Así no hay estado de sesión y se puede escalar horizontalmente.'),
    N('La autorización se hace por rol con @PreAuthorize("hasRole(\'ADMIN\')") y a nivel de objeto: un cliente solo ve sus propios pedidos.'),
    H2('3.4 Integración de servicios externos'),
    B('**Pasarela de pagos:** la interfaz PaymentGateway define el contrato y SimulatedPaymentGateway lo implementa como un sandbox. Las tarjetas de 13 a 19 dígitos se aprueban y las que terminan en 0002 se rechazan, igual que las tarjetas de prueba de Stripe o Wompi. Para pasar a producción basta con crear, por ejemplo, un WompiPaymentGateway.'),
    B('**Notificaciones:** notification-service envía correos por SMTP. En desarrollo se usa Mailpit, una bandeja de prueba en http://localhost:8025. En producción basta con configurar Gmail u otro proveedor mediante variables de entorno.'),
    H2('3.5 Documentación de la API (Swagger / OpenAPI)'),
    P('Cada servicio publica su especificación OpenAPI 3 en /v3/api-docs y su interfaz Swagger en /swagger-ui.html, con el botón "Authorize" para probar con un JWT. Rutas: http://localhost:8081, 8082, 8083 y 8085.'),
    T(['Método', 'Ruta (vía gateway)', 'Acceso', 'Descripción'], [
      ['POST', '/api/auth/register', 'Público', 'Registra un cliente y devuelve el JWT'],
      ['POST', '/api/auth/login', 'Público (10/min por IP)', 'Inicia sesión y devuelve el JWT'],
      ['GET', '/api/auth/me', 'Autenticado', 'Datos del usuario actual'],
      ['GET', '/api/products?q=&categoria=&page=&size=', 'Público', 'Lista o busca productos (paginado, máx. 50)'],
      ['GET', '/api/products/{id}', 'Público', 'Detalle de un producto'],
      ['POST / PUT / DELETE', '/api/products[/{id}]', 'ADMIN', 'Crear, actualizar o eliminar un producto'],
      ['POST', '/internal/products/{id}/reserve | release', 'Interno (X-Internal-Key)', 'Reservar o devolver stock (no expuesto en el gateway)'],
      ['POST', '/api/orders', 'Autenticado', 'Crea un pedido y lo paga'],
      ['GET', '/api/orders/mine', 'Autenticado', 'Pedidos del usuario'],
      ['GET', '/api/orders/{id}', 'Dueño o ADMIN', 'Detalle del pedido'],
      ['GET', '/api/orders', 'ADMIN', 'Todos los pedidos'],
      ['PATCH', '/api/orders/{id}/status', 'ADMIN (cliente: solo CANCELADO)', 'Cambia el estado del pedido'],
      ['POST', '/api/chat', 'Público (JWT opcional)', 'Envía un mensaje al asistente'],
      ['GET', '/api/chat/menu', 'Público', 'Saludo y opciones iniciales'],
    ], [1.6, 3.6, 2.2, 3]),
    SP(),
    P('Ejemplo de petición para crear un pedido:'),
    ...CODE(['POST /api/orders', 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...', '{', '  "items": [{ "productoId": 1, "cantidad": 2 }],', '  "metodoPago": "TARJETA",', '  "numeroTarjeta": "4111111111111111",', '  "direccionEnvio": "Calle 10 # 5-20, Neiva"', '}']),
    SP(),
    P('Los errores tienen un formato JSON uniforme, {"status": 400, "error": "...", "campos": {...}}, y nunca exponen trazas internas.'),
    H2('3.6 Scripts de base de datos'),
    P('El archivo backend/database/init.sql se ejecuta automáticamente la primera vez que arranca el contenedor de MySQL. Hace lo siguiente: (1) crea la base de datos shopnova_db con utf8mb4; (2) crea las tablas usuarios, productos, pedidos e items_pedido con sus índices; (3) inserta 14 productos de ejemplo. El usuario de aplicación (DB_USER) lo crea el propio contenedor de MySQL a partir del archivo .env. El administrador lo crea auth-service al arrancar (AdminSeeder) para que su contraseña quede cifrada con BCrypt.'));

  // ================= 4. FASE 3 =================
  c.push(H1('4. Fase 3 - Automatización conversacional'),
    H2('4.1 Enfoque'),
    P('Se implementó **Nova**, un asistente virtual con un **motor de reglas deterministas** organizado como un árbol de decisión. Se eligió este enfoque en lugar de una API de IA porque da respuestas predecibles y verificables y no tiene costo por consulta. Además, puede consultar datos reales del sistema (productos y pedidos) sin riesgo de inventar información. El motor (ChatbotEngine) está escrito en Java puro, sin dependencias de Spring, y recibe los servicios externos como interfaces (puertos). Esto permite probarlo con pruebas unitarias y cambiar después una regla por una llamada a un modelo de IA.'),
    H2('4.2 Funcionamiento'),
    N('**Normalización:** el mensaje se pasa a minúsculas y se le quitan las tildes y los signos ("¿Envíos?" → "envios").'),
    N('**Evaluación en orden:** las reglas se revisan de la más específica a la más general y responde la primera que coincide.'),
    N('**Acción:** puede ser una respuesta fija (FAQ) o una consulta a otro microservicio.'),
    N('**Respuesta:** texto más botones de opciones sugeridas para guiar la conversación.'),
    IMG('diagramas/chatbot-arbol.png'), CAP('Figura 6. Árbol de decisión del asistente virtual'),
    H2('4.3 Intenciones soportadas'),
    T(['Intención', 'Ejemplos de mensaje', 'Respuesta'], [
      ['saludo', 'hola, buenas, ayuda, menú', 'Saludo y menú de opciones'],
      ['estado_pedido', 'estado pedido 12, ¿dónde está mi orden 12?', 'Consulta en vivo a order-service con el JWT del usuario'],
      ['buscar_producto', 'precio de audífonos, ¿tienen teclados?', 'Consulta en vivo a catalog-service (hasta 3 resultados)'],
      ['envios', '¿cuánto tarda el envío?, domicilio', 'Tiempos y costo de envío'],
      ['pagos', 'métodos de pago, ¿puedo pagar contra entrega?', 'Medios de pago'],
      ['devoluciones', 'quiero devolver un producto, garantía', 'Política de devoluciones'],
      ['cancelar', 'cancelar pedido', 'Cómo cancelar un pedido'],
      ['cuenta', 'crear cuenta, contraseña', 'Ayuda de registro'],
      ['asesor', 'hablar con un asesor, teléfono, horario', 'Canales de contacto humano'],
      ['gracias', 'gracias, chao', 'Despedida'],
      ['desconocido', '(cualquier otro texto)', 'Mensaje de ayuda y menú (fallback)'],
    ], [2, 4, 4]),
    SP(),
    H2('4.4 Integración con el backend y la interfaz'),
    P('El widget de chat está en la esquina inferior derecha de todas las pantallas. Envía POST /api/chat con el mensaje y, si el usuario inició sesión, con su JWT. chatbot-service reenvía el token a order-service, que es quien decide si el usuario puede ver ese pedido. Así el asistente nunca muestra pedidos de otra persona. Si un servicio no responde, el bot da un mensaje amable en lugar de un error.'),
    IMG('capturas/06-chatbot.png'), CAP('Figura 7. Asistente virtual integrado: responde una FAQ y consulta el estado real de un pedido'),
    P('Pruebas unitarias del motor: ChatbotEngineTest valida la detección de 8 intenciones, la consulta de pedidos, la exigencia de sesión y la búsqueda en el catálogo.'));

  // ================= 5. FASE 4 =================
  c.push(H1('5. Fase 4 - Aseguramiento de calidad y requisitos no funcionales'),
    NOTE('**Cómo usar esta sección:** los scripts de prueba están en la carpeta tests/. Las columnas marcadas como "Pendiente" deben diligenciarse con los valores reales que se obtengan al ejecutar las pruebas sobre el sistema desplegado, ya que dependen del equipo donde se corran.'),
    H2('5.1 Pruebas de rendimiento'),
    H3('Herramienta y escenarios'),
    P('Se usa **k6** (Grafana). Cada script simula el comportamiento real de un comprador: navegar el catálogo, buscar, preguntarle al chatbot y, en el 30 % de los casos, registrarse y comprar.'),
    T(['Prueba', 'Script', 'Perfil de carga', 'Criterios de aceptación'], [
      ['Carga', 'tests/performance/load-test.js', '0→20 usuarios (30 s), 50 usuarios (1 min), bajada (30 s)', 'p95 < 800 ms; errores < 1 %; crear pedido p95 < 1,5 s'],
      ['Estrés', 'tests/performance/stress-test.js', '50 → 100 → 200 → 300 usuarios, luego recuperación', 'Hallar el punto de quiebre; p99 < 3 s; el sistema se recupera'],
    ], [1.2, 3, 3.5, 3.5]),
    SP(),
    ...CODE(['k6 run tests/performance/load-test.js', 'k6 run tests/performance/stress-test.js', 'python tests/performance/grafica.py   # genera resultado-carga.png y resultado-estres.png']),
    SP(),
    H3('Resultados'),
    T(['Métrica', 'Objetivo', 'Prueba de carga', 'Prueba de estrés'], [
      ['Peticiones totales / throughput (req/s)', '—', PEND, PEND],
      ['Tiempo de respuesta promedio', '—', PEND, PEND],
      ['Percentil 95 (p95)', '< 800 ms', PEND, PEND],
      ['Percentil 99 (p99)', '< 3 s (estrés)', PEND, PEND],
      ['Tasa de errores HTTP', '< 1 %', PEND, PEND],
      ['p95 catálogo / chatbot / crear pedido', '— / — / < 1,5 s', PEND, '—'],
      ['Usuarios concurrentes en el punto de quiebre', '—', '—', PEND],
      ['Consumo de CPU / RAM (docker stats)', '—', PEND, PEND],
    ], [3, 2, 2.5, 2.5]),
    SP(),
    P('Inserte aquí las gráficas resultado-carga.png y resultado-estres.png que genera grafica.py. También puede agregar una captura del panel de k6 o del comando docker stats durante la prueba.', { italics: true, color: '555555' }),
    H3('Cuellos de botella esperados y mitigación'),
    P('Del análisis de la arquitectura se identifican los puntos que probablemente limitarán el rendimiento. La prueba de estrés debe confirmar o descartar cada uno.'),
    T(['Posible cuello de botella', 'Causa', 'Mitigación'], [
      ['Creación de pedidos', 'Llamadas síncronas en serie a catalog-service (una por producto) + escritura en BD', 'Endpoint de reserva por lotes; réplicas de order-service'],
      ['Producto muy vendido', 'El bloqueo pesimista serializa las compras del mismo producto', 'Aceptable para la consistencia; a gran escala, reservar en Redis'],
      ['Registro de usuarios', 'BCrypt consume CPU a propósito', 'Más CPU/réplicas para auth-service; no bajar el costo de BCrypt'],
      ['Pool de conexiones', 'HikariCP limitado a 20 conexiones por servicio', 'Ajustar el pool según los resultados; réplicas de lectura de MySQL'],
      ['Rate limiting del gateway', 'Bajo estrés desde una sola IP aparecen respuestas 429', 'Es la protección esperada; distribuir la prueba en varias IP o ajustar los límites'],
      ['Lecturas repetidas del catálogo', 'Cada visita consulta MySQL', 'Caché HTTP en Nginx o Redis para GET /api/products'],
    ], [2.5, 4, 4]),
    H2('5.2 Pruebas de seguridad'),
    H3('Matriz OWASP Top 10 (2021)'),
    T(['Riesgo OWASP', 'Control implementado', 'Prueba automatizada'], [
      ['A01 Control de acceso roto', 'Roles con @PreAuthorize; verificación de dueño (anti-IDOR); /internal bloqueado en el gateway; el rol no se toma del registro', '401 sin token, 403 cliente→admin, 404 pedido ajeno, 404 /internal, registro con rol=ADMIN queda como CLIENTE'],
      ['A02 Fallas criptográficas', 'BCrypt para contraseñas; JWT HS256 con secreto ≥ 32 caracteres; no se guarda el número de tarjeta', 'JWT con firma alterada → 401; JWT con alg "none" → 401; la respuesta no expone la contraseña'],
      ['A03 Inyección', 'JPQL parametrizado; Bean Validation; patrones que rechazan < >; textContent en el frontend', 'SQLi en búsqueda y login; XSS en la dirección; cantidad negativa; JSON malformado'],
      ['A04 Diseño inseguro', 'Máquina de estados del pedido; Saga con compensación; límites de cantidad (1-20) y de página (≤ 50)', 'Pedido enviado no se puede cancelar (E2E CA-19)'],
      ['A05 Configuración insegura', 'Cabeceras CSP, X-Frame-Options, nosniff; server_tokens off; errores sin trazas', 'Verificación de cabeceras y de la versión del servidor'],
      ['A06 Componentes vulnerables', 'Versiones recientes de Spring Boot, MySQL y Nginx', 'Manual: OWASP Dependency-Check / docker scout'],
      ['A07 Fallas de autenticación', 'Política de contraseñas; mensaje genérico (anti-enumeración); rate limiting de 10 intentos/min en login', 'Contraseña débil → 400; mismo error para usuario inexistente y clave errada; 429 tras varios intentos'],
      ['A08 Integridad de datos', 'Firma JWT; clave interna entre servicios comparada en tiempo constante', 'Cubierto por las pruebas de A02'],
      ['A09 Registro y monitoreo', 'Logs de eventos y errores; Actuator /health', 'Manual: revisar docker compose logs'],
      ['A10 SSRF', 'Las URL entre servicios son fijas por configuración; el usuario no envía URL que el servidor consulte', 'No aplica'],
    ], [2.2, 4.3, 4]),
    SP(),
    ...CODE(['node tests/security/security-tests.mjs', 'docker run --rm --network host ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://localhost -r zap-report.html']),
    SP(),
    T(['Resultado', 'Valor'], [
      ['Pruebas superadas del script de seguridad (21 casos)', PEND],
      ['Alertas de OWASP ZAP (altas / medias / bajas)', PEND],
    ], [3, 2]),
    H3('Plan de mitigación de vulnerabilidades'),
    T(['#', 'Vulnerabilidad / riesgo residual', 'Severidad', 'Acción de mitigación', 'Prioridad'], [
      ['1', 'Tráfico sin cifrar (HTTP) en el entorno de pruebas', 'Alta', 'Habilitar HTTPS con Let\'s Encrypt en Nginx y HSTS', 'Antes de producción'],
      ['2', 'Secretos (JWT_SECRET, claves de BD) en el archivo .env', 'Alta', 'Usar un gestor de secretos (Docker secrets, AWS Secrets Manager) y rotarlos', 'Antes de producción'],
      ['3', 'Credenciales por defecto (admin, RabbitMQ, MySQL)', 'Alta', 'Cambiarlas en el primer despliegue; no exponer los puertos 3307 y 15672', 'Antes de producción'],
      ['4', 'El JWT no se puede revocar antes de que expire', 'Media', 'Tokens de corta duración + refresh token y lista de revocación en Redis', 'Siguiente versión'],
      ['5', 'Token en sessionStorage, accesible si existiera un XSS', 'Media', 'Mantener la CSP estricta; evaluar cookies HttpOnly + SameSite', 'Siguiente versión'],
      ['6', 'Swagger expuesto públicamente', 'Baja', 'Deshabilitarlo en producción (springdoc.api-docs.enabled=false)', 'Antes de producción'],
      ['7', 'Dependencias sin escaneo continuo', 'Media', 'Agregar OWASP Dependency-Check y Dependabot al pipeline CI', 'Siguiente versión'],
      ['8', 'Monitoreo y alertas limitados', 'Media', 'Centralizar logs (ELK/Loki) y métricas (Prometheus + Grafana)', 'Siguiente versión'],
      ['9', 'Rate limiting solo por IP', 'Baja', 'Agregar límites por usuario y CAPTCHA después de varios fallos de login', 'Siguiente versión'],
    ], [0.5, 3.5, 1.3, 4, 1.7]),
    H2('5.3 Pruebas de usabilidad'),
    H3('Evaluación heurística (Nielsen)'),
    P('Se evaluó la interfaz con las 10 heurísticas de Jakob Nielsen. La severidad usa su escala: 0 = no es problema, 1 = cosmético, 2 = menor, 3 = mayor, 4 = catastrófico.'),
    T(['Heurística', 'Hallazgo', 'Sev.', 'Recomendación'], [
      ['1. Visibilidad del estado del sistema', 'Hay contador del carrito, notificaciones emergentes y etiquetas de estado de color. No hay indicador de carga durante el pago.', '2', 'Mostrar un spinner y deshabilitar el botón "Pagar" mientras se procesa'],
      ['2. Relación con el mundo real', 'Lenguaje en español, precios en pesos colombianos y estados entendibles (PAGADO, ENVIADO).', '0', '—'],
      ['3. Control y libertad del usuario', 'Se puede ajustar el carrito, cancelar los diálogos y cancelar pedidos no enviados.', '0', '—'],
      ['4. Consistencia y estándares', 'Botones primarios del mismo color y carrito en la esquina superior derecha, como en otras tiendas.', '1', 'Unificar los textos de los botones ("Ingresar" vs "Iniciar sesión")'],
      ['5. Prevención de errores', 'Validación de formularios, límite de stock en el carrito y confirmación antes de cancelar.', '1', 'Validar el formato de la tarjeta mientras se escribe'],
      ['6. Reconocer antes que recordar', 'Categorías visibles y botones de opciones en el chat.', '0', '—'],
      ['7. Flexibilidad y eficiencia', 'Búsqueda libre y atajos del chatbot. No hay filtros por precio.', '2', 'Agregar ordenamiento y filtro por rango de precio'],
      ['8. Diseño estético y minimalista', 'Interfaz limpia, con tarjetas y buen espaciado.', '0', '—'],
      ['9. Ayudar a reconocer y recuperarse de errores', 'Los errores del servidor se muestran con el campo afectado, pero algunos usan nombres técnicos (p. ej. "direccionEnvio").', '2', 'Traducir los nombres de los campos a texto amigable'],
      ['10. Ayuda y documentación', 'El asistente virtual responde preguntas frecuentes y hay un manual de usuario.', '0', '—'],
    ], [2.5, 4.2, 0.7, 3]),
    SP(),
    H3('Prueba con usuarios reales'),
    P('**Protocolo:** de 5 a 8 participantes que no conozcan el sistema realizan estas tareas mientras piensan en voz alta. Se mide si completan cada tarea, cuánto tardan y cuántos errores cometen. Al final responden el cuestionario **SUS** (System Usability Scale, 10 preguntas en escala de 1 a 5). Un puntaje SUS de 68 o más se considera aceptable.'),
    T(['Tarea', 'Éxito esperado', 'Tiempo objetivo', '% de éxito obtenido', 'Tiempo promedio'], [
      ['T1. Registrarse en la tienda', '100 %', '< 60 s', PEND, PEND],
      ['T2. Encontrar unos audífonos y agregarlos al carrito', '100 %', '< 45 s', PEND, PEND],
      ['T3. Comprar con tarjeta', '≥ 90 %', '< 90 s', PEND, PEND],
      ['T4. Preguntarle al asistente cuánto tarda el envío', '≥ 90 %', '< 30 s', PEND, PEND],
      ['T5. Consultar el estado del pedido y cancelarlo', '≥ 90 %', '< 45 s', PEND, PEND],
    ], [3.5, 1.4, 1.6, 2, 2]),
    SP(),
    P('**Puntaje SUS promedio:** ____________ (cálculo: por cada participante, sume (respuesta − 1) en las preguntas impares y (5 − respuesta) en las pares, y multiplique el total por 2,5).'));

  // ================= 6. FASE 5 =================
  c.push(H1('6. Fase 5 - Despliegue y validación final'),
    H2('6.1 Contenerización'),
    P('El proyecto está organizado en dos carpetas: **frontend/** (la tienda web y la configuración de Nginx) y **backend/** (los cinco microservicios y el script de base de datos). Cada microservicio tiene un Dockerfile **multi-etapa**: la primera etapa compila con Maven y la segunda ejecuta el JAR sobre una imagen liviana (eclipse-temurin:17-jre-alpine) con un usuario sin privilegios. El frontend usa una imagen de Nginx. El archivo docker-compose.yml orquesta los 9 contenedores con healthchecks (los servicios esperan a que MySQL y RabbitMQ estén listos), límites de memoria, reinicio automático, una red interna y un volumen persistente para la base de datos.'),
    IMG('diagramas/despliegue.png'), CAP('Figura 8. Diagrama de despliegue'),
    H2('6.2 Despliegue'),
    H3('Entorno local o de pruebas'),
    ...CODE(['git clone <repositorio> && cd shopnova', 'cp .env.example .env', 'docker compose up -d --build', 'docker compose ps']),
    SP(),
    H3('Entorno en la nube'),
    N('Crear una máquina virtual Linux con al menos 2 vCPU y 4 GB de RAM (AWS EC2 t3.medium, Azure B2s o Google Cloud e2-medium).'),
    N('Instalar Docker Engine y el plugin de Compose.'),
    N('Abrir solo el puerto 80/443 en el firewall o grupo de seguridad. No exponer MySQL, RabbitMQ ni los puertos de los servicios.'),
    N('Copiar el proyecto, editar .env con secretos fuertes y ejecutar docker compose up -d --build.'),
    N('(Recomendado) Configurar un dominio y HTTPS con Let\'s Encrypt.'),
    N('Ejecutar las pruebas E2E apuntando a la nueva URL: BASE_URL=http://<ip-publica> node tests/e2e/e2e-tests.mjs'),
    H2('6.3 Pruebas de aceptación End-to-End'),
    P('El script tests/e2e/e2e-tests.mjs recorre el flujo completo de negocio contra el sistema desplegado, pasando por el gateway, tal como lo haría un usuario real. Cada caso corresponde a un criterio de aceptación de una historia de usuario.'),
    T(['ID', 'Criterio de aceptación', 'Resultado'], [
      ['CA-01', 'Un visitante puede registrarse', PEND],
      ['CA-02', 'El cliente inicia sesión y recibe un JWT', PEND],
      ['CA-03', 'El catálogo lista productos', PEND],
      ['CA-04', 'La búsqueda filtra por nombre', PEND],
      ['CA-05', 'El filtro por categoría funciona', PEND],
      ['CA-06', 'El cliente compra con una tarjeta aprobada', PEND],
      ['CA-07', 'El total del pedido es correcto', PEND],
      ['CA-08', 'El stock se descuenta (order → catalog síncrono)', PEND],
      ['CA-09', 'Un pago rechazado no crea el pedido (402)', PEND],
      ['CA-10', 'Tras el rechazo, el stock se compensa', PEND],
      ['CA-11', 'No se puede comprar más que el stock disponible (409)', PEND],
      ['CA-12', 'El cliente ve su pedido en "Mis pedidos"', PEND],
      ['CA-13', 'Llega el correo de confirmación (evento asíncrono)', PEND],
      ['CA-14', 'El chatbot saluda y muestra el menú', PEND],
      ['CA-15', 'El chatbot consulta el estado real del pedido', PEND],
      ['CA-16', 'El chatbot busca productos en el catálogo', PEND],
      ['CA-17', 'El administrador inicia sesión', PEND],
      ['CA-18', 'El administrador marca el pedido como ENVIADO', PEND],
      ['CA-19', 'Un pedido enviado ya no se puede cancelar (409)', PEND],
      ['CA-20', 'El administrador crea un producto', PEND],
      ['CA-21', 'El administrador elimina un producto', PEND],
    ], [1, 6, 3]),
    SP(),
    P('Además se incluyen pruebas unitarias con JUnit 5 y Mockito: JwtServiceTest (auth), PedidoServiceTest (pedido exitoso, pago rechazado con compensación y transiciones de estado) y ChatbotEngineTest. Se ejecutan con mvn test dentro de cada servicio.'));

  // ================= 7. MANUAL TÉCNICO =================
  c.push(H1('7. Manual técnico'),
    H2('7.1 Requisitos'),
    B('Docker 24+ con Docker Compose v2, y al menos 4 GB de RAM libres para los contenedores.'),
    B('Para desarrollo sin Docker: JDK 17, Maven 3.9, MySQL 8 y RabbitMQ 3.'),
    B('Para las pruebas: Node.js 18+, k6 y (opcional) Python 3 con matplotlib.'),
    H2('7.2 Estructura del repositorio'),
    ...CODE(['shopnova/', '├── frontend/                  (tienda web + API Gateway)', '│   ├── index.html', '│   ├── css/styles.css', '│   ├── js/                    (main, api, auth, catalogo, carrito,', '│   │                           pedidos, admin, chat, navegacion, utils)', '│   ├── nginx.conf', '│   └── Dockerfile', '├── backend/', '│   ├── auth-service/          (Spring Boot: usuarios y JWT)', '│   ├── catalog-service/       (Spring Boot: productos)', '│   ├── order-service/         (Spring Boot: pedidos, pago y eventos)', '│   ├── notification-service/  (Spring Boot: correos)', '│   ├── chatbot-service/       (Spring Boot: asistente)', '│   └── database/init.sql      (script de la base de datos)', '├── tests/                     (e2e, security, performance)', '├── docs/                      (documentación y diagramas)', '├── docker-compose.yml', '└── .env.example']),
    SP(),
    P('Cada servicio Spring Boot sigue la misma organización por paquetes: config (seguridad y OpenAPI), security (JWT), web (controladores, DTO y manejo de errores) y los paquetes de dominio (user, product, pedido, events, client, payment).'),
    H2('7.3 Variables de entorno'),
    T(['Variable', 'Uso', 'Valor de desarrollo'], [
      ['JWT_SECRET', 'Secreto compartido para firmar y validar los JWT (≥ 32 caracteres)', 'cambie-este-secreto-...'],
      ['INTERNAL_KEY', 'Clave para las llamadas internas order → catalog', 'clave-interna-...'],
      ['MYSQL_ROOT_PASSWORD / DB_USER / DB_PASSWORD', 'Credenciales de MySQL (base de datos shopnova_db)', 'root123 / shopnova / shopnova123'],
      ['RABBIT_USER / RABBIT_PASSWORD', 'Credenciales de RabbitMQ', 'shopnova / shopnova123'],
      ['ADMIN_EMAIL / ADMIN_PASSWORD', 'Administrador inicial', 'admin@shopnova.com / Admin123*'],
      ['MAIL_HOST / MAIL_PORT / MAIL_USER / MAIL_PASSWORD', 'Servidor SMTP', 'mailpit / 1025'],
      ['MAIL_SMTP_AUTH / MAIL_STARTTLS', 'true para Gmail (puerto 587 + contraseña de aplicación)', 'false / false'],
    ], [3.5, 4, 3]),
    SP(),
    NOTE('Las variables del .env se leen solo la primera vez que se crea la base de datos. Si cambia DB_USER o DB_PASSWORD después, ejecute docker compose down -v para recrearla (se borran los datos).'),
    H2('7.4 Operación'),
    T(['Tarea', 'Comando'], [
      ['Iniciar / detener todo', 'docker compose up -d --build  ·  docker compose down'],
      ['Ver el estado', 'docker compose ps'],
      ['Ver los logs de un servicio', 'docker compose logs -f order-service'],
      ['Escalar un servicio', 'docker compose up -d --scale catalog-service=3 (quitando el mapeo de puertos del servicio)'],
      ['Copia de seguridad de la BD', 'docker exec shopnova-mysql mysqldump -uroot -p --all-databases > backup.sql'],
      ['Reiniciar la BD desde cero', 'docker compose down -v (borra el volumen mysql_data)'],
      ['Salud de un servicio', 'curl http://localhost:8082/actuator/health'],
      ['Ejecutar un servicio sin Docker', 'cd backend/catalog-service && mvn spring-boot:run'],
    ], [3, 7]),
    SP(),
    H2('7.5 Solución de problemas'),
    T(['Síntoma', 'Causa probable', 'Solución'], [
      ['Un servicio se reinicia en bucle', 'MySQL aún no termina de iniciar o hay un error de credenciales', 'Revisar docker compose logs <servicio>; esperar el healthcheck de MySQL'],
      ['Puerto 80 o 3307 ocupado', 'Otro programa usa el puerto', 'Cambiar el puerto izquierdo en docker-compose.yml (p. ej. "8080:80")'],
      ['"No autenticado" en todo', 'Token expirado o JWT_SECRET distinto entre servicios', 'Iniciar sesión de nuevo; usar el mismo .env para todos'],
      ['No llegan correos', 'notification-service no conecta a RabbitMQ o al SMTP', 'Revisar la cola en http://localhost:15672 y los mensajes en la DLQ'],
      ['Error 503 al comprar', 'catalog-service caído o lento', 'docker compose restart catalog-service'],
      ['Error 429', 'Rate limiting del gateway', 'Esperar un minuto; ajustar los límites en nginx.conf'],
    ], [2.5, 3.5, 4]));

  // ================= 8. MANUAL DE USUARIO =================
  c.push(H1('8. Manual de usuario'),
    P('ShopNova se usa desde cualquier navegador moderno, ingresando a la dirección de la tienda (en local: http://localhost).'),
    H2('8.1 Explorar el catálogo'),
    P('En la página principal se ven los productos con su precio y las unidades disponibles. Puede filtrar por categoría con los botones superiores, buscar por nombre con la barra de búsqueda y moverse entre páginas con "Anterior" y "Siguiente". No necesita una cuenta para ver los productos.'),
    IMG('capturas/01-catalogo.png'), CAP('Figura 9. Catálogo de productos'),
    H2('8.2 Crear una cuenta e ingresar'),
    N('Haga clic en **Ingresar** (arriba a la derecha).'),
    N('Si no tiene cuenta, haga clic en "¿No tienes cuenta? Crear cuenta", escriba su nombre, correo y una contraseña de al menos 8 caracteres con letras y números.'),
    N('Si ya tiene cuenta, escriba su correo y contraseña y pulse **Ingresar**. Su nombre aparecerá en la parte superior.'),
    IMG('capturas/02-login.png'), CAP('Figura 10. Inicio de sesión'),
    H2('8.3 Agregar productos al carrito'),
    P('Pulse **Agregar al carrito** en cada producto. El ícono 🛒 muestra cuántos productos lleva. Al abrirlo puede aumentar o disminuir las cantidades con los botones + y −. Si llega a cero, el producto se quita del carrito.'),
    IMG('capturas/03-carrito.png'), CAP('Figura 11. Carrito de compras'),
    H2('8.4 Pagar el pedido'),
    N('En el carrito, pulse **Ir a pagar** (si no ha iniciado sesión, el sistema se lo pedirá).'),
    N('Escriba la dirección de envío.'),
    N('Elija el método de pago: **Tarjeta** (escriba el número) o **Contra entrega**.'),
    N('Pulse **Pagar**. Si el pago se aprueba, verá el número de su pedido y recibirá un correo de confirmación.'),
    IMG('capturas/04-checkout.png'), CAP('Figura 12. Finalizar compra'),
    NOTE('Entorno de pruebas: use la tarjeta 4111111111111111 para un pago aprobado, o cualquier número que termine en 0002 para ver un pago rechazado.'),
    H2('8.5 Consultar y cancelar pedidos'),
    P('En **Mis pedidos** verá todos sus pedidos con su estado: PAGADO (en preparación), ENVIADO, ENTREGADO o CANCELADO. Mientras el pedido esté en estado PAGADO puede pulsar **Cancelar pedido**. Las unidades vuelven al inventario y recibirá un correo.'),
    IMG('capturas/05-mis-pedidos.png'), CAP('Figura 13. Mis pedidos'),
    H2('8.6 Usar el asistente virtual'),
    P('Pulse el botón 💬 en la esquina inferior derecha. Puede elegir una de las opciones sugeridas o escribir su pregunta, por ejemplo:'),
    B('"¿Cuánto tarda el envío?", "métodos de pago", "quiero devolver un producto".'),
    B('"precio de audífonos" o "¿tienen teclados?" para buscar en el catálogo.'),
    B('"estado pedido 7" para conocer el estado de su pedido (debe haber iniciado sesión).'),
    B('"hablar con un asesor" para obtener los datos de contacto.'),
    H2('8.7 Administración (solo administradores)'),
    P('Al ingresar con una cuenta de administrador aparece la opción **Administración**:'),
    B('**Productos:** llene el formulario y pulse **Guardar** para crear un producto. Desde el catálogo, los botones **Editar** y 🗑 permiten modificar o eliminar productos.'),
    B('**Pedidos:** se listan todos los pedidos. Use los botones "→ ENVIADO", "→ ENTREGADO" o "→ CANCELADO" para avanzar su estado; el cliente recibe un correo con cada cambio.'),
    IMG('capturas/07-admin.png'), CAP('Figura 14. Panel de administración'));

  // ================= 9. PRESENTACIÓN Y CONCLUSIONES =================
  c.push(H1('9. Guion para la defensa del proyecto'),
    T(['Min.', 'Tema', 'Qué mostrar'], [
      ['0-2', 'Problema y escenario', 'E-commerce de alta concurrencia; objetivos'],
      ['2-6', 'Arquitectura (Fase 1)', 'Diagramas C4 de contexto y contenedores; REST frente a RabbitMQ; una sola base de datos con tablas por servicio; Saga'],
      ['6-11', 'Demo en vivo (Fases 2, 3 y 5)', 'docker compose ps → registro → compra → correo en Mailpit → evento en RabbitMQ → chatbot consultando el pedido → admin cambia el estado'],
      ['11-13', 'Swagger y código', 'Swagger de order-service; PedidoService (saga) y ChatbotEngine'],
      ['13-17', 'Calidad (Fase 4)', 'Ejecutar el script de seguridad en vivo; gráficas de k6; cuellos de botella; heurísticas'],
      ['17-19', 'Pruebas E2E', 'Ejecutar node tests/e2e/e2e-tests.mjs (todo en verde)'],
      ['19-20', 'Conclusiones', 'Lecciones aprendidas y trabajo futuro'],
    ], [1, 2.5, 6.5]),
    SP(),
    H1('10. Conclusiones'),
    B('Dividir el sistema por capacidades de negocio permitió que cada servicio tuviera una responsabilidad clara y sus propios datos, y que pueda escalarse y desplegarse por separado.'),
    B('Combinar comunicación síncrona (para decisiones que necesitan respuesta inmediata, como el stock) y asíncrona (para tareas que pueden esperar, como el correo) mejora la disponibilidad: la compra no depende del servidor de correo.'),
    B('Sin transacciones distribuidas, la consistencia se logra con una Saga con compensación y con bloqueos sobre el inventario.'),
    B('Un chatbot por reglas, bien diseñado y conectado al backend, resuelve las consultas frecuentes con respuestas exactas y sin costo. Su diseño con puertos permite agregar IA más adelante.'),
    B('La seguridad debe estar en varias capas (gateway, servicio y frontend), y las pruebas automatizadas basadas en OWASP permiten verificarla de forma repetible.'),
    H2('Trabajo futuro'),
    B('Pipeline de CI/CD con GitHub Actions (compilación, pruebas, escaneo de dependencias e imágenes).'),
    B('Orquestación con Kubernetes y autoescalado horizontal.'),
    B('Caché con Redis, refresh tokens e integración con una pasarela de pagos real (Wompi o PayU).'),
    B('Asistente híbrido: reglas para las consultas transaccionales y un modelo de lenguaje para las preguntas abiertas.'));

  const doc = new Document({
    creator: 'Alejandro Cardoso Parra',
    title: 'ShopNova - Documentación del proyecto final',
    styles: {
      default: { document: { run: { font: FONT, size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 34, bold: true, color: PRI }, paragraph: { spacing: { before: 240, after: 200 }, keepNext: true, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 27, bold: true, color: '1F2937' }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 23, bold: true, color: '4F46E5' }, paragraph: { spacing: { before: 200, after: 100 }, keepNext: true, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    ] },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'ShopNova · Ingeniería de Software II', size: 16, color: '888888', font: FONT })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Página ', PageNumber.CURRENT], size: 18, font: FONT, color: '888888' })] })] }) },
      children: c,
    }],
  });
  // Numeración independiente para cada lista numerada: se reinicia por instancia
  fs.writeFileSync(path.join(D, 'ShopNova-Documentacion-Proyecto-Final.docx'), await Packer.toBuffer(doc));
  console.log('OK');
})();
