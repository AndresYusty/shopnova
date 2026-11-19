# ShopNova · Plataforma de e-commerce distribuida e inteligente

Proyecto final de **Ingeniería de Software II**. Es un e-commerce construido con microservicios. Incluye un asistente virtual basado en reglas, comunicación síncrona (REST) y asíncrona (RabbitMQ), seguridad con JWT y despliegue con Docker Compose.

## Arquitectura

| Contenedor | Tecnología | Puerto | Responsabilidad |
|---|---|---|---|
| frontend | Nginx | 80 | Tienda web + API Gateway, rate limiting y cabeceras de seguridad |
| auth-service | Spring Boot 3 | 8081 | Registro, login y emisión de JWT |
| catalog-service | Spring Boot 3 | 8082 | Productos, búsqueda e inventario |
| order-service | Spring Boot 3 | 8083 | Pedidos, pago simulado y publicación de eventos |
| notification-service | Spring Boot 3 | – | Consume eventos de RabbitMQ y envía correos |
| chatbot-service | Spring Boot 3 | 8085 | Asistente virtual con motor de reglas |
| mysql | MySQL 8.4 | 3307 | Una sola base de datos `shopnova_db` (cada servicio maneja sus propias tablas) |
| rabbitmq | RabbitMQ 3.13 | 15672 | Broker de mensajes (exchange `shopnova.events`) |
| mailpit | Mailpit | 8025 | Bandeja de correo de prueba |

## Cómo ejecutarlo

Requisitos: Docker Desktop (o Docker Engine + Compose v2).

```bash
cp .env.example .env          # (ya viene un .env de desarrollo)
docker compose up -d --build  # la primera vez tarda unos minutos (descarga dependencias Maven)
docker compose ps             # espere a que todos estén "running"
```

| Qué | URL |
|---|---|
| Tienda | http://localhost |
| Swagger auth / catálogo / pedidos / chatbot | http://localhost:8081/swagger-ui.html · :8082 · :8083 · :8085 |
| RabbitMQ (shopnova / shopnova123) | http://localhost:15672 |
| Correos enviados | http://localhost:8025 |

Usuario administrador: `admin@shopnova.com` / `Admin123*`
Tarjeta de prueba aprobada: `4111111111111111`. Tarjeta rechazada: cualquiera que termine en `0002`.

## Pruebas

```bash
# Unitarias (por servicio)
cd backend/order-service && mvn test

# Aceptación End-to-End (Node 18+, sin dependencias)
node tests/e2e/e2e-tests.mjs

# Seguridad OWASP Top 10
node tests/security/security-tests.mjs

# Rendimiento con k6 (https://k6.io)
k6 run tests/performance/load-test.js
k6 run tests/performance/stress-test.js
python tests/performance/grafica.py    # gráficas PNG (requiere matplotlib)

# Escaneo automático con OWASP ZAP
docker run --rm --network host ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://localhost -r zap-report.html
```

## Estructura

```
frontend/
  index.html               Estructura de la tienda
  css/styles.css           Estilos
  js/                      Un módulo por funcionalidad: main, api, auth, catalogo,
                           carrito, pedidos, admin, chat, navegacion, utils
  nginx.conf, Dockerfile   Servidor web + API Gateway
backend/
  auth-service/            Usuarios y JWT
  catalog-service/         Productos e inventario
  order-service/           Pedidos, pago y eventos
  notification-service/    Correos
  chatbot-service/         Asistente virtual
  database/init.sql        Script de la base de datos (tablas y datos de ejemplo)
tests/                     Pruebas e2e, de seguridad y de rendimiento (k6)
docs/                      Documentación, diagramas C4 y capturas
docker-compose.yml         Despliegue completo
```
