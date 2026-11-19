package com.shopnova.chatbot.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.shopnova.chatbot.engine.Lookups;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Adaptadores HTTP: el chatbot consulta catalog-service y order-service vía REST. */
@Component
public class HttpLookups implements Lookups.CatalogLookup, Lookups.OrderLookup {

    private final RestClient catalog;
    private final RestClient orders;

    public HttpLookups(@Value("${app.catalog-url}") String catalogUrl, @Value("${app.order-url}") String orderUrl) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(Duration.ofSeconds(2));
        f.setReadTimeout(Duration.ofSeconds(4));
        this.catalog = RestClient.builder().baseUrl(catalogUrl).requestFactory(f).build();
        this.orders = RestClient.builder().baseUrl(orderUrl).requestFactory(f).build();
    }

    @Override
    public List<Lookups.ProductInfo> buscar(String termino) {
        JsonNode page = catalog.get().uri(u -> u.path("/api/products").queryParam("q", termino).queryParam("size", 3).build())
                .retrieve().body(JsonNode.class);
        List<Lookups.ProductInfo> out = new ArrayList<>();
        if (page != null && page.has("content")) {
            page.get("content").forEach(n -> out.add(new Lookups.ProductInfo(n.get("id").asLong(), n.get("nombre").asText(),
                    new BigDecimal(n.get("precio").asText()), n.get("stock").asInt())));
        }
        return out;
    }

    @Override
    public Optional<Lookups.OrderInfo> estado(long pedidoId, String bearerToken) {
        try {
            JsonNode n = orders.get().uri("/api/orders/{id}", pedidoId)
                    .header("Authorization", bearerToken)
                    .retrieve().body(JsonNode.class);
            if (n == null) return Optional.empty();
            return Optional.of(new Lookups.OrderInfo(n.get("id").asLong(), n.get("estado").asText(),
                    new BigDecimal(n.get("total").asText()), n.path("fecha").asText()));
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new SecurityException("token inválido");
        }
    }
}
