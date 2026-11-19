package com.shopnova.order.pedido;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "usuario_email", nullable = false, length = 120)
    private String usuarioEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoPedido estado;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "metodo_pago", nullable = false, length = 20)
    private String metodoPago;

    @Column(length = 20)
    private String franquicia;

    @Column(name = "transaccion_id", length = 60)
    private String transaccionId;

    @Column(name = "direccion_envio", nullable = false, length = 200)
    private String direccionEnvio;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ItemPedido> items = new ArrayList<>();

    protected Pedido() {
    }

    public Pedido(Long usuarioId, String usuarioEmail, String metodoPago, String direccionEnvio) {
        this.usuarioId = usuarioId;
        this.usuarioEmail = usuarioEmail;
        this.metodoPago = metodoPago;
        this.direccionEnvio = direccionEnvio;
        this.estado = EstadoPedido.PAGADO;
    }

    public void agregarItem(ItemPedido item) {
        item.setPedido(this);
        items.add(item);
        total = total.add(item.getSubtotal());
    }

    public void cambiarEstado(EstadoPedido nuevo) {
        if (!estado.puedePasarA(nuevo)) {
            throw new IllegalStateException("No se puede pasar de " + estado + " a " + nuevo);
        }
        this.estado = nuevo;
    }

    public void setTransaccionId(String transaccionId) { this.transaccionId = transaccionId; }
    public void setFranquicia(String franquicia) { this.franquicia = franquicia; }
    public Long getId() { return id; }
    public Long getUsuarioId() { return usuarioId; }
    public String getUsuarioEmail() { return usuarioEmail; }
    public EstadoPedido getEstado() { return estado; }
    public BigDecimal getTotal() { return total; }
    public String getMetodoPago() { return metodoPago; }
    public String getFranquicia() { return franquicia; }
    public String getTransaccionId() { return transaccionId; }
    public String getDireccionEnvio() { return direccionEnvio; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<ItemPedido> getItems() { return items; }
}
