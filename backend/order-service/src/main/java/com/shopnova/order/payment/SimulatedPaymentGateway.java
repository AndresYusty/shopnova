package com.shopnova.order.payment;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Pasarela de pagos simulada. Acepta Visa y Mastercard.
 * Una tarjeta válida que termina en 0002 es rechazada por el banco emisor.
 */
@Component
public class SimulatedPaymentGateway implements PaymentGateway {

    @Override
    public PaymentResult cobrar(BigDecimal monto, String metodoPago, String numeroTarjeta) {
        if (monto == null || monto.signum() <= 0) {
            return new PaymentResult(false, null, "Monto inválido", null);
        }
        if ("TARJETA".equals(metodoPago)) {
            String numero = numeroTarjeta == null ? "" : numeroTarjeta.replaceAll("\\D", "");
            String marca = franquicia(numero);
            if (marca == null) {
                return new PaymentResult(false, null, "Solo aceptamos Visa o Mastercard", null);
            }
            if (numero.endsWith("0002")) {
                return new PaymentResult(false, null, "Pago rechazado por el banco emisor", marca);
            }
            return new PaymentResult(true, "TX-" + UUID.randomUUID().toString().substring(0, 13).toUpperCase(), "Aprobado", marca);
        }
        return new PaymentResult(true, "TX-" + UUID.randomUUID().toString().substring(0, 13).toUpperCase(), "Aprobado", null);
    }

    /** Visa: empieza por 4. Mastercard: 51-55 o 2221-2720. */
    static String franquicia(String numero) {
        if (numero.startsWith("4") && (numero.length() == 13 || numero.length() == 16 || numero.length() == 19)) {
            return "Visa";
        }
        if (numero.length() == 16) {
            int dos = Integer.parseInt(numero.substring(0, 2));
            int cuatro = Integer.parseInt(numero.substring(0, 4));
            if ((dos >= 51 && dos <= 55) || (cuatro >= 2221 && cuatro <= 2720)) {
                return "Mastercard";
            }
        }
        return null;
    }
}
