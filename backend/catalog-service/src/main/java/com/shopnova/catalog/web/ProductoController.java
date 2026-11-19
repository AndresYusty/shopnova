package com.shopnova.catalog.web;

import com.shopnova.catalog.product.ProductoService;
import com.shopnova.catalog.web.dto.ProductoRequest;
import com.shopnova.catalog.web.dto.ProductoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Productos")
public class ProductoController {

    private final ProductoService service;

    public ProductoController(ProductoService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar/buscar productos (público, paginado)")
    public Page<ProductoResponse> listar(@RequestParam(required = false) String q,
                                         @RequestParam(required = false) String categoria,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "12") int size) {
        int s = Math.min(Math.max(size, 1), 50); // límite para evitar consultas abusivas
        return service.buscar(q, categoria, PageRequest.of(Math.max(page, 0), s, Sort.by("id")));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de un producto (público)")
    public ProductoResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Crear producto (ADMIN)")
    public ProductoResponse crear(@Valid @RequestBody ProductoRequest req) {
        return service.crear(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Actualizar producto (ADMIN)")
    public ProductoResponse actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequest req) {
        return service.actualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Eliminar producto (ADMIN)")
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }
}
