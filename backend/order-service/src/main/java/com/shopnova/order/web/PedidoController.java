package com.shopnova.order.web;

import com.shopnova.order.pedido.PedidoService;
import com.shopnova.order.security.AuthUser;
import com.shopnova.order.web.dto.CambiarEstadoRequest;
import com.shopnova.order.web.dto.CrearPedidoRequest;
import com.shopnova.order.web.dto.PedidoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Pedidos")
public class PedidoController {

    private final PedidoService service;

    public PedidoController(PedidoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear pedido (checkout + pago simulado)",
            description = "Solo Visa o Mastercard. Si el número termina en 0002, el banco rechaza el pago.")
    public PedidoResponse crear(@Valid @RequestBody CrearPedidoRequest req, @AuthenticationPrincipal AuthUser user) {
        return service.crear(req, user);
    }

    @GetMapping("/mine")
    @Operation(summary = "Mis pedidos")
    public List<PedidoResponse> mios(@AuthenticationPrincipal AuthUser user) {
        return service.misPedidos(user);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de un pedido (dueño o ADMIN)")
    public PedidoResponse obtener(@PathVariable Long id, @AuthenticationPrincipal AuthUser user) {
        return service.obtener(id, user);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Todos los pedidos (ADMIN)")
    public List<PedidoResponse> todos() {
        return service.todos();
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cambiar estado (ADMIN; el cliente solo puede CANCELAR)")
    public PedidoResponse estado(@PathVariable Long id, @Valid @RequestBody CambiarEstadoRequest req,
                                 @AuthenticationPrincipal AuthUser user) {
        return service.cambiarEstado(id, req.estado(), user);
    }
}
