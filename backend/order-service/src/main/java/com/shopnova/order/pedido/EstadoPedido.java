package com.shopnova.order.pedido;

public enum EstadoPedido {
    PAGADO, ENVIADO, ENTREGADO, CANCELADO;

    /** Máquina de estados: transiciones permitidas. */
    public boolean puedePasarA(EstadoPedido nuevo) {
        return switch (this) {
            case PAGADO -> nuevo == ENVIADO || nuevo == CANCELADO;
            case ENVIADO -> nuevo == ENTREGADO;
            case ENTREGADO, CANCELADO -> false;
        };
    }
}
