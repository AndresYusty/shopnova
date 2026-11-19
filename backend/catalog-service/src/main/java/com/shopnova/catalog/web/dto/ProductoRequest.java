package com.shopnova.catalog.web.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductoRequest(
        @NotBlank @Size(max = 120) @Pattern(regexp = "^[^<>]*$", message = "no se permiten etiquetas HTML") String nombre,
        @Size(max = 500) @Pattern(regexp = "^[^<>]*$", message = "no se permiten etiquetas HTML") String descripcion,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 10, fraction = 2) BigDecimal precio,
        @NotNull @Min(0) @Max(100000) Integer stock,
        @NotBlank @Size(max = 60) String categoria,
        @Size(max = 300) @Pattern(regexp = "^(https?://.*)?$", message = "debe ser una URL http(s)") String imagenUrl) {
}
