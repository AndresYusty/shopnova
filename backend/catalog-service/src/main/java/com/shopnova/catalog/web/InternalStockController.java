package com.shopnova.catalog.web;

import com.shopnova.catalog.product.ProductoService;
import com.shopnova.catalog.web.dto.CantidadRequest;
import com.shopnova.catalog.web.dto.ProductoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

/**
 * Endpoints de comunicación interna servicio-a-servicio (order-service -> catalog-service).
 * No se publican en el gateway (solo /api/**) y además exigen la cabecera X-Internal-Key.
 */
@RestController
@RequestMapping("/internal/products")
@Tag(name = "Interno (servicio a servicio)")
public class InternalStockController {

    private final ProductoService service;
    private final String internalKey;

    public InternalStockController(ProductoService service, @Value("${app.internal-key}") String internalKey) {
        this.service = service;
        this.internalKey = internalKey;
    }

    @PostMapping("/{id}/reserve")
    @Operation(summary = "Descontar stock para un pedido")
    public ProductoResponse reservar(@RequestHeader("X-Internal-Key") String key, @PathVariable Long id,
                                     @Valid @RequestBody CantidadRequest req) {
        check(key);
        return service.reservar(id, req.cantidad());
    }

    @PostMapping("/{id}/release")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Devolver stock (compensación)")
    public void liberar(@RequestHeader("X-Internal-Key") String key, @PathVariable Long id,
                        @Valid @RequestBody CantidadRequest req) {
        check(key);
        service.liberar(id, req.cantidad());
    }

    private void check(String key) {
        // Comparación en tiempo constante para no filtrar información por tiempos de respuesta
        if (!MessageDigest.isEqual(internalKey.getBytes(StandardCharsets.UTF_8), key.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Clave interna inválida");
        }
    }
}
