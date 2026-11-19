package com.shopnova.order.web.dto;

import com.shopnova.order.pedido.Pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponse(Long id, String estado, BigDecimal total, String metodoPago, String franquicia,
                             String transaccionId, String direccionEnvio, LocalDateTime fecha, List<Item> items) {

    public record Item(Long productoId, String producto, BigDecimal precioUnitario, Integer cantidad, BigDecimal subtotal) {
    }

    public static PedidoResponse from(Pedido p) {
        return new PedidoResponse(p.getId(), p.getEstado().name(), p.getTotal(), p.getMetodoPago(), p.getFranquicia(),
                p.getTransaccionId(), p.getDireccionEnvio(), p.getCreatedAt(),
                p.getItems().stream().map(i -> new Item(i.getProductoId(), i.getProductoNombre(), i.getPrecioUnitario(),
                        i.getCantidad(), i.getSubtotal())).toList());
    }
}
