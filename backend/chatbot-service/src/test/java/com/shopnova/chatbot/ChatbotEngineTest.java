package com.shopnova.chatbot;

import com.shopnova.chatbot.engine.ChatbotEngine;
import com.shopnova.chatbot.engine.Lookups;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class ChatbotEngineTest {

    private final ChatbotEngine bot = new ChatbotEngine(
            q -> q.equals("audifonos") ? List.of(new Lookups.ProductInfo(1L, "Audífonos Bluetooth", new BigDecimal("189900"), 5)) : List.of(),
            (id, tok) -> id == 12 ? Optional.of(new Lookups.OrderInfo(12L, "ENVIADO", new BigDecimal("250000"), "2026-11-18")) : Optional.empty());

    @ParameterizedTest
    @CsvSource({
            "Hola!, saludo",
            "¿Cuánto tarda el envío?, envios",
            "Métodos de pago, pagos",
            "quiero devolver un producto, devoluciones",
            "Hablar con un asesor, asesor",
            "cancelar pedido 3, cancelar",
            "precio de audífonos, buscar_producto",
            "asdfgh, desconocido"
    })
    void detectaIntencion(String mensaje, String intencion) {
        assertEquals(intencion, bot.responder(mensaje, "Bearer x").intencion());
    }

    @Test
    void consultaEstadoDePedido() {
        var r = bot.responder("estado pedido 12", "Bearer x");
        assertTrue(r.respuesta().contains("ENVIADO"));
    }

    @Test
    void pideIniciarSesionSinToken() {
        assertTrue(bot.responder("estado pedido 12", null).respuesta().contains("iniciar sesión"));
    }

    @Test
    void buscaEnCatalogo() {
        assertTrue(bot.responder("precio de audífonos", null).respuesta().contains("Audífonos Bluetooth"));
    }

    @Test
    void explicaQueNoHaySesion() {
        var r = bot.responder("y como sabes si no he iniciado sesion?", null);
        assertEquals("cuenta", r.intencion());
        assertTrue(r.respuesta().contains("No has iniciado sesión"));
    }

    @Test
    void reconoceSesionActiva() {
        assertTrue(bot.responder("ya inicie sesion?", "Bearer x").respuesta().contains("sesión está iniciada"));
    }

    @Test
    void pedidoSinNumeroExigeSesion() {
        var r = bot.responder("estado de mi pedido", null);
        assertEquals("estado_pedido", r.intencion());
        assertTrue(r.respuesta().contains("iniciar sesión") || r.respuesta().contains("Ingresar"));
    }

    @Test
    void comprarNoSeConfundeConUnPedido() {
        assertEquals("buscar_producto", bot.responder("quiero comprar audífonos", null).intencion());
    }

    @Test
    void buscaUnaCamaAunqueAntesHablaranDeSesion() {
        var r = bot.responder("busca una cama", null, "Nova: No has iniciado sesión. Pulsa Ingresar.");
        assertEquals("buscar_producto", r.intencion());
        assertTrue(r.respuesta().contains("cama"));
        assertFalse(r.respuesta().contains("sesión"));
    }

    @Test
    void elDesconocidoCitaLoQueDijo() {
        var r = bot.responder("asdfgh", null);
        assertEquals("desconocido", r.intencion());
        assertTrue(r.respuesta().contains("asdfgh"));
    }
}
