package com.shopnova.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import java.text.NumberFormat;
import java.util.Locale;

/** Consumidor asíncrono: recibe eventos de pedidos y envía correos al cliente. */
@Component
public class NotificationListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationListener.class);
    private final JavaMailSender mail;
    private final String from;

    public NotificationListener(JavaMailSender mail, @Value("${app.mail.from}") String from) {
        this.mail = mail;
        this.from = from;
    }

    @RabbitListener(queues = RabbitConfig.QUEUE)
    public void onPedido(PedidoEvent evt) {
        log.info("Evento recibido: {} pedido #{} estado {}", evt.tipo(), evt.pedidoId(), evt.estado());
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(evt.email());
        msg.setSubject(asunto(evt));
        msg.setText(cuerpo(evt));
        mail.send(msg); // si falla, el mensaje se reintenta y luego va a la DLQ
    }

    private String asunto(PedidoEvent e) {
        return "order.created".equals(e.tipo())
                ? "ShopNova - Confirmación de tu pedido #" + e.pedidoId()
                : "ShopNova - Tu pedido #" + e.pedidoId() + " ahora está " + e.estado();
    }

    private String cuerpo(PedidoEvent e) {
        NumberFormat cop = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-CO"));
        StringBuilder sb = new StringBuilder("Hola,\n\n");
        if ("order.created".equals(e.tipo())) {
            sb.append("Recibimos tu pedido #").append(e.pedidoId()).append(". Detalle:\n\n");
            if (e.items() != null) {
                e.items().forEach(i -> sb.append(" - ").append(i.cantidad()).append(" x ").append(i.producto())
                        .append(" (").append(cop.format(i.precioUnitario())).append(")\n"));
            }
            sb.append("\nTotal pagado: ").append(cop.format(e.total())).append("\n");
        } else {
            sb.append("El estado de tu pedido #").append(e.pedidoId()).append(" cambió a: ").append(e.estado()).append("\n");
        }
        return sb.append("\nGracias por comprar en ShopNova.").toString();
    }
}
