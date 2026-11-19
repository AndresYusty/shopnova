package com.shopnova.order.events;

import com.shopnova.order.pedido.Pedido;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(EventPublisher.class);
    private final RabbitTemplate rabbit;

    public EventPublisher(RabbitTemplate rabbit) {
        this.rabbit = rabbit;
    }

    /** routingKey: order.created | order.status */
    public void publicar(String routingKey, Pedido p) {
        var items = p.getItems().stream()
                .map(i -> new PedidoEvent.Item(i.getProductoNombre(), i.getCantidad(), i.getPrecioUnitario()))
                .toList();
        var evt = new PedidoEvent(routingKey, p.getId(), p.getUsuarioId(), p.getUsuarioEmail(),
                p.getEstado().name(), p.getTotal(), items, LocalDateTime.now().toString());
        try {
            rabbit.convertAndSend(RabbitConfig.EXCHANGE, routingKey, evt);
        } catch (AmqpException e) {
            // La notificación no es crítica: si RabbitMQ falla, el pedido igual queda registrado.
            log.warn("No se pudo publicar el evento {} del pedido {}: {}", routingKey, p.getId(), e.getMessage());
        }
    }
}
