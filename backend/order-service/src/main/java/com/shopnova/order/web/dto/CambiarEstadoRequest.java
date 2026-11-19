package com.shopnova.order.web.dto;

import com.shopnova.order.pedido.EstadoPedido;
import jakarta.validation.constraints.NotNull;

public record CambiarEstadoRequest(@NotNull EstadoPedido estado) {
}
