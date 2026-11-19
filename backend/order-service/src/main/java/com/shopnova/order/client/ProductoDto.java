package com.shopnova.order.client;

import java.math.BigDecimal;

public record ProductoDto(Long id, String nombre, BigDecimal precio, Integer stock) {
}
