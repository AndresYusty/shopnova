package com.shopnova.order.pedido;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "items_pedido")
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;

    @Column(name = "producto_id", nullable = false)
    private Long productoId;

    /** Copia del nombre y precio al momento de la compra (el catálogo puede cambiar después). */
    @Column(name = "producto_nombre", nullable = false, length = 120)
    private String productoNombre;

    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false)
    private Integer cantidad;

    protected ItemPedido() {
    }

    public ItemPedido(Long productoId, String productoNombre, BigDecimal precioUnitario, Integer cantidad) {
        this.productoId = productoId;
        this.productoNombre = productoNombre;
        this.precioUnitario = precioUnitario;
        this.cantidad = cantidad;
    }

    public BigDecimal getSubtotal() {
        return precioUnitario.multiply(BigDecimal.valueOf(cantidad));
    }

    void setPedido(Pedido pedido) { this.pedido = pedido; }
    public Long getId() { return id; }
    public Long getProductoId() { return productoId; }
    public String getProductoNombre() { return productoNombre; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public Integer getCantidad() { return cantidad; }
}
