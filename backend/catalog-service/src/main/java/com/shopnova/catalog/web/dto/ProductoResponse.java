package com.shopnova.catalog.web.dto;

import com.shopnova.catalog.product.Producto;

import java.math.BigDecimal;

public record ProductoResponse(Long id, String nombre, String descripcion, BigDecimal precio,
                               Integer stock, String categoria, String imagenUrl) {
    public static ProductoResponse from(Producto p) {
        return new ProductoResponse(p.getId(), p.getNombre(), p.getDescripcion(), p.getPrecio(),
                p.getStock(), p.getCategoria(), p.getImagenUrl());
    }
}
