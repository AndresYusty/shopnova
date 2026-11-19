-- =====================================================================
-- ShopNova - Script de base de datos (MySQL 8)
-- Una sola base de datos (shopnova_db). Cada microservicio administra sus propias tablas:
--   auth-service    -> usuarios
--   catalog-service -> productos
--   order-service   -> pedidos, items_pedido
-- Se ejecuta automáticamente la primera vez que arranca el contenedor de MySQL.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS shopnova_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopnova_db;
-- El usuario de aplicación (DB_USER / DB_PASSWORD del .env) lo crea automáticamente
-- el contenedor de MySQL con las variables MYSQL_USER y MYSQL_PASSWORD.

-- ------------------- Tablas de auth-service -------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  email       VARCHAR(120) NOT NULL UNIQUE,
  password    VARCHAR(100) NOT NULL COMMENT 'hash BCrypt',
  rol         VARCHAR(20)  NOT NULL DEFAULT 'CLIENTE',
  created_at  DATETIME(6)  NOT NULL
) ENGINE=InnoDB;
-- El usuario ADMIN se crea al iniciar auth-service (AdminSeeder) para cifrar la clave con BCrypt.

-- ------------------- Tablas de catalog-service -------------------
CREATE TABLE IF NOT EXISTS productos (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(120)   NOT NULL,
  descripcion  VARCHAR(500),
  precio       DECIMAL(12,2)  NOT NULL,
  stock        INT            NOT NULL,
  categoria    VARCHAR(60)    NOT NULL,
  imagen_url   VARCHAR(300),
  version      BIGINT         DEFAULT 0,
  INDEX idx_productos_categoria (categoria),
  INDEX idx_productos_nombre (nombre)
) ENGINE=InnoDB;

INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url, version) VALUES
('Audífonos Bluetooth Pro', 'Cancelación de ruido activa, 30 h de batería', 189900, 40, 'Tecnología', '/img/audifonos.jpg', 0),
('Teclado mecánico RGB', 'Switches rojos, distribución en español', 249900, 25, 'Tecnología', '/img/teclado.jpg', 0),
('Mouse inalámbrico', 'Sensor 4000 DPI, silencioso', 69900, 60, 'Tecnología', '/img/mouse.jpg', 0),
('Monitor 24" IPS', 'Full HD, 75 Hz, bordes delgados', 649900, 15, 'Tecnología', '/img/monitor.jpg', 0),
('Smartwatch Fit', 'Monitor de ritmo cardiaco y GPS', 299900, 30, 'Tecnología', '/img/reloj.jpg', 0),
('Cafetera de goteo', '12 tazas, filtro permanente', 159900, 20, 'Hogar', '/img/cafetera.jpg', 0),
('Juego de sábanas', 'Algodón 300 hilos, doble', 119900, 35, 'Hogar', '/img/sabanas.jpg', 0),
('Lámpara LED de escritorio', 'Luz regulable y puerto USB', 89900, 45, 'Hogar', '/img/lampara.jpg', 0),
('Balón de fútbol', 'Tamaño 5, cosido a máquina', 79900, 50, 'Deportes', '/img/balon.jpg', 0),
('Mat de yoga', 'Antideslizante, 6 mm', 59900, 40, 'Deportes', '/img/yoga.jpg', 0),
('Mancuernas 5 kg (par)', 'Recubiertas en neopreno', 99900, 30, 'Deportes', '/img/pesas.jpg', 0),
('Tenis para correr', 'Suela amortiguada, transpirables', 279900, 25, 'Moda', '/img/tenis.jpg', 0),
('Chaqueta impermeable', 'Capucha desmontable', 219900, 20, 'Moda', '/img/chaqueta.jpg', 0),
('Morral urbano', 'Compartimento para portátil 15"', 139900, 35, 'Moda', '/img/morral.jpg', 0),
('Parlante Bluetooth', 'Resistente al agua, 12 h de batería', 129900, 30, 'Tecnología', '/img/parlante.jpg', 0),
('Cargador portátil', '20 000 mAh, dos salidas USB', 89900, 40, 'Tecnología', '/img/powerbank.jpg', 0),
('Refrigeración líquida RGB', 'Para gabinete, ventiladores ARGB', 389900, 12, 'Tecnología', '/img/refrigeracion.jpg', 0),
('Licuadora de vaso', 'Vaso de vidrio, 1.25 L', 149900, 18, 'Hogar', '/img/licuadora.jpg', 0),
('Molino de café', 'Muelas cónicas, molienda ajustable', 189900, 15, 'Hogar', '/img/molino.jpg', 0),
('Juego de cuchillos', 'Cinco piezas con estuche de cuero', 159900, 22, 'Hogar', '/img/cuchillos.jpg', 0),
('Silla tapizada', 'Estructura de madera, tela mostaza', 249900, 10, 'Hogar', '/img/silla.jpg', 0),
('Aspiradora robot', 'Navegación inteligente, apta para alfombra', 699900, 8, 'Hogar', '/img/aspiradora.jpg', 0),
('Botella térmica', 'Acero inoxidable, 750 ml', 49900, 55, 'Deportes', '/img/botella.jpg', 0),
('Balón de baloncesto', 'Tamaño oficial, cuero sintético', 89900, 28, 'Deportes', '/img/baloncesto.jpg', 0),
('Gorra clásica', 'Ajustable, visera curva', 39900, 40, 'Moda', '/img/gorra.jpg', 0),
('Gafas de sol', 'Lente oscuro, marco metálico', 79900, 32, 'Moda', '/img/gafas.jpg', 0),
('Camiseta básica', 'Algodón, cuello redondo', 45900, 50, 'Moda', '/img/camiseta.jpg', 0);

-- ------------------- Tablas de order-service -------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id       BIGINT        NOT NULL COMMENT 'id del usuario (tabla usuarios de auth-service)',
  usuario_email    VARCHAR(120)  NOT NULL,
  estado           VARCHAR(20)   NOT NULL,
  total            DECIMAL(12,2) NOT NULL,
  metodo_pago      VARCHAR(20)   NOT NULL,
  franquicia       VARCHAR(20)   NULL,
  transaccion_id   VARCHAR(60),
  direccion_envio  VARCHAR(200)  NOT NULL,
  created_at       DATETIME(6)   NOT NULL,
  INDEX idx_pedidos_usuario (usuario_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS items_pedido (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  pedido_id        BIGINT        NOT NULL,
  producto_id      BIGINT        NOT NULL COMMENT 'id del producto (tabla productos de catalog-service)',
  producto_nombre  VARCHAR(120)  NOT NULL,
  precio_unitario  DECIMAL(12,2) NOT NULL,
  cantidad         INT           NOT NULL,
  CONSTRAINT fk_items_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB;
