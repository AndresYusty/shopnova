package com.shopnova.catalog.product;

import com.shopnova.catalog.web.dto.ProductoRequest;
import com.shopnova.catalog.web.dto.ProductoResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProductoService {

    private final ProductoRepository repo;

    public ProductoService(ProductoRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public Page<ProductoResponse> buscar(String q, String categoria, Pageable pageable) {
        return repo.buscar(blankToNull(q), blankToNull(categoria), pageable).map(ProductoResponse::from);
    }

    @Transactional(readOnly = true)
    public ProductoResponse obtener(Long id) {
        return ProductoResponse.from(find(id));
    }

    @Transactional
    public ProductoResponse crear(ProductoRequest r) {
        return ProductoResponse.from(repo.save(new Producto(r.nombre(), r.descripcion(), r.precio(), r.stock(), r.categoria(), r.imagenUrl())));
    }

    @Transactional
    public ProductoResponse actualizar(Long id, ProductoRequest r) {
        Producto p = find(id);
        p.actualizar(r.nombre(), r.descripcion(), r.precio(), r.stock(), r.categoria(), r.imagenUrl());
        return ProductoResponse.from(p);
    }

    @Transactional
    public void eliminar(Long id) {
        repo.delete(find(id));
    }

    /** Reserva (descuenta) stock. Llamado por order-service de forma síncrona. */
    @Transactional
    public ProductoResponse reservar(Long id, int cantidad) {
        Producto p = findForUpdate(id);
        try {
            p.descontarStock(cantidad);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
        }
        return ProductoResponse.from(repo.saveAndFlush(p));
    }

    /** Compensación: devuelve stock si el pedido falla después de reservar. */
    @Transactional
    public void liberar(Long id, int cantidad) {
        findForUpdate(id).devolverStock(cantidad);
    }

    private Producto find(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    private Producto findForUpdate(Long id) {
        return repo.findForUpdate(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
