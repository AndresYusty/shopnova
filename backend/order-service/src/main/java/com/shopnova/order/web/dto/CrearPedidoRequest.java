package com.shopnova.order.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record CrearPedidoRequest(
        @NotEmpty @Size(max = 50) List<@Valid ItemRequest> items,
        @NotBlank @Pattern(regexp = "TARJETA|CONTRAENTREGA", message = "debe ser TARJETA o CONTRAENTREGA") String metodoPago,
        String numeroTarjeta,
        @NotBlank @Size(min = 5, max = 200) @Pattern(regexp = "^[^<>]*$", message = "no se permiten etiquetas HTML") String direccionEnvio) {

    public record ItemRequest(@NotNull @Positive Long productoId, @NotNull @Min(1) @Max(20) Integer cantidad) {
    }
}
