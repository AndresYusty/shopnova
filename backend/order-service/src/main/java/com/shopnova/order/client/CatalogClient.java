package com.shopnova.order.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Map;

/**
 * Cliente REST síncrono hacia catalog-service (comunicación servicio a servicio).
 * Tiene timeouts cortos para no bloquear hilos si el catálogo está caído.
 */
@Component
public class CatalogClient {

    private final RestClient rest;
    private final String internalKey;

    public CatalogClient(@Value("${app.catalog-url}") String baseUrl, @Value("${app.internal-key}") String internalKey) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(Duration.ofSeconds(2));
        f.setReadTimeout(Duration.ofSeconds(5));
        this.rest = RestClient.builder().baseUrl(baseUrl).requestFactory(f).build();
        this.internalKey = internalKey;
    }

    public ProductoDto reservar(Long productoId, int cantidad) {
        return call(() -> rest.post().uri("/internal/products/{id}/reserve", productoId)
                .header("X-Internal-Key", internalKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("cantidad", cantidad))
                .retrieve().body(ProductoDto.class));
    }

    public void liberar(Long productoId, int cantidad) {
        call(() -> rest.post().uri("/internal/products/{id}/release", productoId)
                .header("X-Internal-Key", internalKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("cantidad", cantidad))
                .retrieve().toBodilessEntity());
    }

    private <T> T call(java.util.function.Supplier<T> s) {
        try {
            return s.get();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado en el catálogo");
        } catch (HttpClientErrorException.Conflict e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Stock insuficiente");
        } catch (ResourceAccessException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "El catálogo no está disponible, intente más tarde");
        }
    }
}
