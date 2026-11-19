package com.shopnova.catalog.product;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(length = 500)
    private String descripcion;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(nullable = false)
    private Integer stock;

    @Column(nullable = false, length = 60)
    private String categoria;

    @Column(name = "imagen_url", length = 300)
    private String imagenUrl;

    /** Control de concurrencia optimista: evita que dos pedidos simultáneos vendan el mismo stock. */
    @Version
    private Long version;

    protected Producto() {
    }

    public Producto(String nombre, String descripcion, BigDecimal precio, Integer stock, String categoria, String imagenUrl) {
        actualizar(nombre, descripcion, precio, stock, categoria, imagenUrl);
    }

    public void actualizar(String nombre, String descripcion, BigDecimal precio, Integer stock, String categoria, String imagenUrl) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.stock = stock;
        this.categoria = categoria;
        this.imagenUrl = imagenUrl;
    }

    public void descontarStock(int cantidad) {
        if (cantidad <= 0 || cantidad > stock) {
            throw new IllegalStateException("Stock insuficiente para " + nombre);
        }
        this.stock -= cantidad;
    }

    public void devolverStock(int cantidad) {
        this.stock += cantidad;
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public String getDescripcion() { return descripcion; }
    public BigDecimal getPrecio() { return precio; }
    public Integer getStock() { return stock; }
    public String getCategoria() { return categoria; }
    public String getImagenUrl() { return imagenUrl; }
}
