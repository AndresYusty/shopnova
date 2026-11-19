package com.shopnova.order.payment;

import java.math.BigDecimal;

/** Puerto hacia la pasarela de pagos (patrón Strategy/Adapter: se puede cambiar por Wompi, PayU, Stripe...). */
public interface PaymentGateway {

    PaymentResult cobrar(BigDecimal monto, String metodoPago, String numeroTarjeta);

    record PaymentResult(boolean aprobado, String transaccionId, String mensaje, String franquicia) {
    }
}
