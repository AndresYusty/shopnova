package com.shopnova.order;

import com.shopnova.order.client.CatalogClient;
import com.shopnova.order.client.ProductoDto;
import com.shopnova.order.events.EventPublisher;
import com.shopnova.order.payment.SimulatedPaymentGateway;
import com.shopnova.order.pedido.EstadoPedido;
import com.shopnova.order.pedido.Pedido;
import com.shopnova.order.pedido.PedidoRepository;
import com.shopnova.order.pedido.PedidoService;
import com.shopnova.order.security.AuthUser;
import com.shopnova.order.web.dto.CrearPedidoRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PedidoServiceTest {

    private PedidoRepository repo;
    private CatalogClient catalog;
    private EventPublisher events;
    private PedidoService service;
    private final AuthUser cliente = new AuthUser(5L, "cli@test.com", "CLIENTE");

    @BeforeEach
    void setUp() {
        repo = mock(PedidoRepository.class);
        catalog = mock(CatalogClient.class);
        events = mock(EventPublisher.class);
        service = new PedidoService(repo, catalog, new SimulatedPaymentGateway(), events);
        when(repo.save(any(Pedido.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private CrearPedidoRequest req(String tarjeta) {
        return new CrearPedidoRequest(List.of(new CrearPedidoRequest.ItemRequest(1L, 2)), "TARJETA", tarjeta, "Calle 1 # 2-3");
    }

    @Test
    void creaPedidoYPublicaEvento() {
        when(catalog.reservar(1L, 2)).thenReturn(new ProductoDto(1L, "Mouse", new BigDecimal("50000"), 8));
        var r = service.crear(req("4111111111111111"), cliente);
        assertEquals(new BigDecimal("100000"), r.total());
        assertEquals("PAGADO", r.estado());
        verify(events).publicar(eq("order.created"), any());
    }

    @Test
    void pagoRechazadoDevuelveStock() {
        when(catalog.reservar(1L, 2)).thenReturn(new ProductoDto(1L, "Mouse", new BigDecimal("50000"), 8));
        assertThrows(ResponseStatusException.class, () -> service.crear(req("4000000000000002"), cliente));
        verify(catalog).liberar(1L, 2);           // compensación
        verify(repo, never()).save(any());
    }

    @Test
    void transicionesDeEstadoValidas() {
        assertTrue(EstadoPedido.PAGADO.puedePasarA(EstadoPedido.ENVIADO));
        assertFalse(EstadoPedido.ENTREGADO.puedePasarA(EstadoPedido.CANCELADO));
    }
}
