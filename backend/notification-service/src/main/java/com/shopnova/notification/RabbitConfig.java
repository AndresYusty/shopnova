package com.shopnova.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Topología de mensajería:
 * exchange "shopnova.events" (topic) --order.*--> cola "notifications.orders"
 * Mensajes que fallan 3 veces van a la Dead Letter Queue "notifications.orders.dlq".
 */
@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "shopnova.events";
    public static final String QUEUE = "notifications.orders";
    public static final String DLQ = "notifications.orders.dlq";

    @Bean
    public TopicExchange eventsExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue notificationsQueue() {
        return QueueBuilder.durable(QUEUE)
                .withArgument("x-dead-letter-exchange", "")
                .withArgument("x-dead-letter-routing-key", DLQ)
                .build();
    }

    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(DLQ).build();
    }

    @Bean
    public Binding binding(Queue notificationsQueue, TopicExchange eventsExchange) {
        return BindingBuilder.bind(notificationsQueue).to(eventsExchange).with("order.*");
    }

    @Bean
    public MessageConverter jsonConverter(ObjectMapper mapper) {
        Jackson2JsonMessageConverter c = new Jackson2JsonMessageConverter(mapper);
        // Ignora el __TypeId__ del productor y usa el tipo del parámetro del listener
        c.setAlwaysConvertToInferredType(true);
        return c;
    }
}
