package com.shopnova.order.pedido;

import com.shopnova.order.client.CatalogClient;
import com.shopnova.order.client.ProductoDto;
import com.shopnova.order.events.EventPublisher;
import com.shopnova.order.payment.PaymentGateway;
import com.shopnova.order.security.AuthUser;
import com.shopnova.order.web.dto.CrearPedidoRequest;
import com.shopnova.order.web.dto.PedidoResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Orquesta la creación del pedido (patrón Saga orquestada simplificada):
 * 1) reserva stock en catalog-service (REST síncrono)
 * 2) cobra con la pasarela de pagos
 * 3) guarda el pedido
 * 4) publica el evento en RabbitMQ (asíncrono) -> notification-service envía el correo.
 * Si algo falla después de reservar, se ejecuta la compensación (devolver stock).
 */
@Service
public class PedidoService {

    private final PedidoRepository repo;
    private final CatalogClient catalog;
    private final PaymentGateway payments;
    private final EventPublisher events;

    public PedidoService(PedidoRepository repo, CatalogClient catalog, PaymentGateway payments, EventPublisher events) {
        this.repo = repo;
        this.catalog = catalog;
        this.payments = payments;
        this.events = events;
    }

    public PedidoResponse crear(CrearPedidoRequest req, AuthUser user) {
        // Agrupa productos repetidos en el carrito
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        req.items().forEach(i -> cantidades.merge(i.productoId(), i.cantidad(), Integer::sum));

        Pedido pedido = new Pedido(user.id(), user.email(), req.metodoPago(), req.direccionEnvio().trim());
        List<Map.Entry<Long, Integer>> reservados = new ArrayList<>();
        try {
            for (var e : cantidades.entrySet()) {
                ProductoDto p = catalog.reservar(e.getKey(), e.getValue());
                reservados.add(e);
                pedido.agregarItem(new ItemPedido(p.id(), p.nombre(), p.precio(), e.getValue()));
            }
            var pago = payments.cobrar(pedido.getTotal(), req.metodoPago(), req.numeroTarjeta());
            if (!pago.aprobado()) {
                throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, pago.mensaje());
            }
            pedido.setTransaccionId(pago.transaccionId());
            pedido.setFranquicia(pago.franquicia());
            Pedido guardado = repo.save(pedido);
            events.publicar("order.created", guardado);
            return PedidoResponse.from(guardado);
        } catch (RuntimeException ex) {
            compensar(reservados);
            throw ex;
        }
    }

    public List<PedidoResponse> misPedidos(AuthUser user) {
        return repo.findByUsuarioIdOrderByIdDesc(user.id()).stream().map(PedidoResponse::from).toList();
    }

    public List<PedidoResponse> todos() {
        return repo.findAllByOrderByIdDesc().stream().map(PedidoResponse::from).toList();
    }

    public PedidoResponse obtener(Long id, AuthUser user) {
        return PedidoResponse.from(findAutorizado(id, user));
    }

    public PedidoResponse cambiarEstado(Long id, EstadoPedido nuevo, AuthUser user) {
        Pedido p = findAutorizado(id, user);
        // Un cliente solo puede cancelar su propio pedido; el resto de transiciones son del ADMIN
        if (!user.isAdmin() && nuevo != EstadoPedido.CANCELADO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo un administrador puede cambiar a " + nuevo);
        }
        try {
            p.cambiarEstado(nuevo);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        if (nuevo == EstadoPedido.CANCELADO) {
            p.getItems().forEach(i -> catalog.liberar(i.getProductoId(), i.getCantidad()));
        }
        Pedido guardado = repo.save(p);
        events.publicar("order.status", guardado);
        return PedidoResponse.from(guardado);
    }

    /** Control de acceso a nivel de objeto (evita IDOR / OWASP A01 Broken Access Control). */
    private Pedido findAutorizado(Long id, AuthUser user) {
        Pedido p = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
        if (!user.isAdmin() && !p.getUsuarioId().equals(user.id())) {
            // 404 en lugar de 403 para no revelar que el pedido existe
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado");
        }
        return p;
    }

    private void compensar(List<Map.Entry<Long, Integer>> reservados) {
        for (var e : reservados) {
            try {
                catalog.liberar(e.getKey(), e.getValue());
            } catch (RuntimeException ignored) {
                // se registra en logs del catálogo; en producción iría a una cola de reintentos
            }
        }
    }
}
