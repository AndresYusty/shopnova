package com.shopnova.notification;

import java.math.BigDecimal;
import java.util.List;

/** Mismo contrato JSON que publica order-service. */
public record PedidoEvent(String tipo, Long pedidoId, Long usuarioId, String email, String estado,
                          BigDecimal total, List<Item> items, String fecha) {

    public record Item(String producto, Integer cantidad, BigDecimal precioUnitario) {
    }
}
