package com.shopnova.chatbot.engine;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/** Puertos hacia otros microservicios (el motor no depende de HTTP: fácil de probar). */
public final class Lookups {

    private Lookups() {
    }

    public interface CatalogLookup {
        List<ProductInfo> buscar(String termino);
    }

    public interface OrderLookup {
        /** @throws SecurityException si no hay sesión válida */
        Optional<OrderInfo> estado(long pedidoId, String bearerToken);
    }

    public record ProductInfo(Long id, String nombre, BigDecimal precio, Integer stock) {
    }

    public record OrderInfo(Long id, String estado, BigDecimal total, String fecha) {
    }
}
