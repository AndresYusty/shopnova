package com.shopnova.chatbot.engine;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.function.BiFunction;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Motor conversacional basado en reglas deterministas (árbol de decisión).
 * Cada regla tiene palabras clave; la primera regla que coincide responde.
 * Algunas reglas consultan otros microservicios (catálogo y pedidos) para dar respuestas dinámicas.
 */
public class ChatbotEngine {

    public static final List<String> MENU = List.of(
            "Estado de mi pedido", "Buscar producto", "Métodos de pago", "Envíos", "Devoluciones", "Hablar con un asesor");

    private static final Pattern NUMERO = Pattern.compile("(\\d{1,9})");
    private static final Pattern BUSQUEDA = Pattern.compile(
            "(?:precio de|precio del|precio|cuesta|cuestan|vale|valen|buscar|busco|buscame|tienen|tienes|hay|venden|quiero|comprar|informacion de|info de|stock de)\\s+(?:un |una |el |la |los |las |unos |unas |algun |alguna )?(?:comprar |ver )?([a-z0-9 ]{2,40})");
    private static final Set<String> RELLENO = Set.of(
            "un", "una", "el", "la", "los", "las", "de", "del", "al", "me", "mi", "mis", "por", "favor", "para", "con",
            "en", "que", "quiero", "busco", "buscar", "precio", "comprar", "compra", "ver", "unos", "unas", "algun",
            "alguna", "cuanto", "cuesta", "cuestan", "vale", "valen", "tienen", "tienes", "hay", "venden", "producto",
            "productos", "informacion", "info", "stock", "disponible", "porfa", "gracias", "hola", "buenos", "buenas",
            "como", "donde", "cuando", "esta", "este", "eso", "esa", "ese", "muy", "mas", "tambien");

    private record Rule(String intencion, List<String> claves, boolean requiereNumero,
                        BiFunction<String, String, ChatResponse> accion) {
        Rule(String intencion, List<String> claves, BiFunction<String, String, ChatResponse> accion) {
            this(intencion, claves, false, accion);
        }

        boolean coincide(String texto) {
            return claves.stream().anyMatch(c -> aparece(texto, c)) && (!requiereNumero || NUMERO.matcher(texto).find());
        }
    }

    private final Lookups.CatalogLookup catalog;
    private final Lookups.OrderLookup orders;
    private final List<Rule> reglas;
    private final NumberFormat cop = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-CO"));

    public ChatbotEngine(Lookups.CatalogLookup catalog, Lookups.OrderLookup orders) {
        this.catalog = catalog;
        this.orders = orders;
        cop.setMaximumFractionDigits(0);
        // El ORDEN importa: reglas más específicas primero (p. ej. "pedido 12" antes que las FAQ).
        this.reglas = List.of(
                new Rule("cuenta", List.of("como sabes", "de donde sacas", "como lo sabes"), this::comoSabes),
                new Rule("cancelar", List.of("cancel*", "anul*"), (t, tok) -> simple("cancelar",
                        "Puedes cancelar un pedido mientras esté en estado PAGADO, antes de que salga. Entra a Mis pedidos y pulsa Cancelar pedido. El stock vuelve al catálogo.")),
                new Rule("estado_pedido", List.of("pedido", "pedidos", "orden", "ordenes"), true, this::estadoPedido),
                new Rule("devoluciones", List.of("devol*", "garant*", "reembolso", "defectuoso", "danad*", "cambio"), (t, tok) -> simple("devoluciones",
                        "Tienes 30 días para devolver un producto y todos tienen 1 año de garantía. Escríbenos a soporte@shopnova.com con el número del pedido y te decimos el paso a paso.")),
                new Rule("envios", List.of("envio", "envios", "domicilio", "despacho", "entrega", "llega", "llegar", "demora", "demoran", "tarda", "tardan"), (t, tok) -> simple("envios",
                        "Enviamos a todo Colombia. En las ciudades principales tarda de 1 a 3 días hábiles y en el resto del país de 3 a 6. El envío es gratis si la compra pasa de $150.000.")),
                new Rule("pagos", List.of("pago", "pagos", "pagar", "tarjeta", "contraentrega", "efectivo", "metodo", "metodos"), (t, tok) -> simple("pagos",
                        "Puedes pagar con Visa o Mastercard, o contra entrega al recibir el paquete. El número de la tarjeta no queda guardado.")),
                new Rule("cuenta", List.of("sesion", "login", "logue*", "registr*", "contrasena", "clave", "iniciar sesion", "crear cuenta", "mi cuenta"), this::cuenta),
                new Rule("comprar", List.of("carrito", "agregar", "anadir"), (t, tok) -> simple("comprar",
                        "Abre el producto en el catálogo, elige la cantidad y agrégalo. Luego entra al carrito y pulsa Ir a pagar. Si aún no has iniciado sesión, te pedimos el correo antes de cobrar.")),
                new Rule("asesor", List.of("asesor", "humano", "persona", "contacto", "telefono", "whatsapp", "correo", "horario"), (t, tok) -> simple("asesor",
                        "Un asesor atiende de lunes a sábado, de 8:00 a.m. a 6:00 p.m. WhatsApp: +57 300 000 0000. Correo: soporte@shopnova.com.")),
                new Rule("estado_pedido", List.of("pedido", "pedidos", "orden", "ordenes", "rastrear", "seguimiento", "donde esta"), this::estadoPedido),
                new Rule("buscar_producto", List.of("precio", "busc*", "encuentr*", "muestr*", "necesit*", "dame", "dime", "tienen", "tienes", "hay", "venden", "quiero", "producto", "productos", "cuesta", "cuestan", "vale", "valen", "comprar", "stock"), this::buscarProducto),
                new Rule("quien", List.of("quien eres", "que eres", "que puedes", "para que sirves", "que haces"), (t, tok) -> new ChatResponse(
                        "Soy Nova, el asistente de ShopNova. Busco productos y precios en el catálogo, consulto tus pedidos si ya iniciaste sesión, y te explico pagos, envíos y devoluciones.",
                        MENU, "quien")),
                new Rule("gracias", List.of("gracias", "chao", "adios", "hasta luego"), (t, tok) -> new ChatResponse(
                        "Con gusto. Si se te ocurre otra cosa de la tienda, escríbela tal cual.", List.of(), "gracias")),
                new Rule("saludo", List.of("hola", "buenos", "buenas", "hey", "saludos", "menu", "ayuda", "volver"), (t, tok) -> new ChatResponse(
                        "Hola, soy Nova. Puedo buscar un producto, revisar un pedido si ya ingresaste, o contarte de pagos, envíos y devoluciones. ¿Qué necesitas?",
                        MENU, "saludo"))
        );
    }

    public ChatResponse responder(String mensaje, String bearerToken) {
        return responder(mensaje, bearerToken, null);
    }

    public ChatResponse responder(String mensaje, String bearerToken, String contexto) {
        String original = mensaje == null ? "" : mensaje.trim();
        String texto = normalizar(original);
        if (texto.isBlank()) {
            return new ChatResponse("Escríbeme la pregunta con tus palabras.", MENU, "vacio");
        }
        ChatResponse directa = reglas.stream().filter(r -> r.coincide(texto)).findFirst()
                .map(r -> r.accion().apply(texto, bearerToken))
                .orElse(null);
        if (directa != null) return directa;
        ChatResponse seguida = seguimiento(texto, bearerToken, contexto);
        if (seguida != null) return seguida;
        if (parecePalabra(terminoDe(texto))) return buscarProducto(texto, bearerToken);
        return noEntendi(original);
    }

    private ChatResponse comoSabes(String texto, String token) {
        if (texto.contains("sesion") || texto.contains("inici") || texto.contains("logue") || texto.contains("cuenta") || texto.contains("ingres")) {
            return explicarSesion(token);
        }
        return simple("cuenta",
                "No lo adivino. El precio y el stock salen del catálogo. El estado de un pedido sale de tu cuenta, y para eso tienes que haber iniciado sesión. Lo demás son las reglas de la tienda: pagos, envíos y devoluciones.");
    }

    private ChatResponse cuenta(String texto, String token) {
        if (aparece(texto, "sesion") || aparece(texto, "login") || aparece(texto, "logue*")
                || texto.contains("iniciar sesion") || texto.contains("no he") || texto.contains("sin sesion")) {
            return explicarSesion(token);
        }
        return simple("cuenta",
                "Para crear la cuenta pulsa Ingresar y después Crear cuenta. La contraseña pide mínimo 8 caracteres, con letras y números. Si ya la tienes, Ingresar te deja dentro y a partir de ahí puedo ver tus pedidos.");
    }

    private ChatResponse explicarSesion(String token) {
        if (token == null || token.isBlank()) {
            return simple("cuenta",
                    "No has iniciado sesión. Lo sé porque este mensaje llegó sin una sesión activa: el navegador no envió tu acceso. Pulsa Ingresar, arriba a la derecha. Sin sesión puedo buscar productos y explicarte pagos, envíos y devoluciones, pero no puedo abrir tus pedidos.");
        }
        return simple("cuenta",
                "Sí, tu sesión está iniciada. Por eso, si me das el número de un pedido, lo busco en tu cuenta. Si pulsas Salir, dejo de verla.");
    }

    private ChatResponse estadoPedido(String texto, String token) {
        Matcher m = NUMERO.matcher(texto);
        if (!m.find()) {
            if (token == null || token.isBlank()) {
                return new ChatResponse(
                        "Para ver un pedido hace falta haber iniciado sesión, y ahora no hay una. Pulsa Ingresar, arriba a la derecha, y luego escríbeme el número, por ejemplo 'pedido 12'.",
                        List.of("Métodos de pago", "Envíos"), "estado_pedido");
            }
            return new ChatResponse(
                    "Tu sesión está activa. Escríbeme el número del pedido, por ejemplo 'pedido 12', y te digo en qué va.",
                    List.of(), "estado_pedido");
        }
        if (token == null || token.isBlank()) {
            return new ChatResponse("Para consultar un pedido primero debes iniciar sesión.", List.of(), "estado_pedido");
        }
        long id = Long.parseLong(m.group(1));
        try {
            Optional<Lookups.OrderInfo> o = orders.estado(id, token);
            return o.map(p -> new ChatResponse(
                            "Tu pedido #" + p.id() + " está en estado " + p.estado() + ". Total: " + dinero(p.total()) + ". " + explicar(p.estado()),
                            List.of("Envíos", "Devoluciones"), "estado_pedido"))
                    .orElseGet(() -> new ChatResponse(
                            "No encontré el pedido #" + id + " en tu cuenta. El número está en Mis pedidos.",
                            List.of(), "estado_pedido"));
        } catch (SecurityException e) {
            return new ChatResponse("Tu sesión expiró. Inicia sesión de nuevo para consultar tus pedidos.", List.of(), "estado_pedido");
        } catch (RuntimeException e) {
            return new ChatResponse("Ahora no pude consultar los pedidos. Inténtalo de nuevo en unos minutos.", List.of("Hablar con un asesor"), "estado_pedido");
        }
    }

    private ChatResponse buscarProducto(String texto, String token) {
        String clave = terminoDe(texto);
        if (clave.isBlank()) {
            return new ChatResponse("¿Qué producto buscas? Escríbelo, por ejemplo 'precio de audífonos' o 'cuánto cuesta el monitor'.", List.of(), "buscar_producto");
        }
        try {
            List<Lookups.ProductInfo> res = catalog.buscar(clave);
            if (res.isEmpty() && clave.endsWith("s") && clave.length() > 4) {
                clave = clave.substring(0, clave.length() - 1);
                res = catalog.buscar(clave);
            }
            if (res.isEmpty()) {
                return new ChatResponse("Busqué «" + clave + "» en la tienda y no está. No vendemos eso. Sí hay audífonos, sábanas, tenis, gorras y el resto del catálogo.", MENU, "buscar_producto");
            }
            StringBuilder sb = new StringBuilder("En el catálogo, sobre " + clave + ":\n");
            res.stream().limit(3).forEach(p -> sb.append("• ").append(p.nombre()).append(" — ").append(dinero(p.precio()))
                    .append(p.stock() != null && p.stock() > 0 ? " (" + p.stock() + " disponibles)" : " (agotado)").append("\n"));
            sb.append("Ábrelo en la tienda para ver la foto y agregarlo al carrito.");
            return new ChatResponse(sb.toString().trim(), List.of("Métodos de pago", "Envíos"), "buscar_producto");
        } catch (RuntimeException e) {
            return new ChatResponse("Ahora no pude consultar el catálogo. Inténtalo de nuevo en unos minutos.", MENU, "buscar_producto");
        }
    }

    private static final Set<String> VAGO = Set.of(
            "si", "no", "ok", "dale", "eso", "ese", "esa", "y", "y eso", "y ese", "el mismo", "la misma",
            "por que", "porque", "nop", "eso no", "y el precio", "y cuanto");

    private ChatResponse seguimiento(String texto, String token, String contexto) {
        if (contexto == null || contexto.isBlank() || !VAGO.contains(texto)) return null;
        String ctx = normalizar(contexto);
        if (ctx.contains("sesion") || ctx.contains("ingresar") || ctx.contains("iniciar")) return explicarSesion(token);
        if (ctx.contains("pedido") || ctx.contains("numero")) return estadoPedido(texto, token);
        if (ctx.contains("producto") || ctx.contains("precio") || ctx.contains("catalogo")) return buscarProducto(texto, token);
        if (texto.equals("no") || texto.equals("eso no") || texto.equals("nop")) {
            return new ChatResponse("De acuerdo. Dime si quieres un pedido, un producto, pagos, envíos o devoluciones.", MENU, "desconocido");
        }
        return null;
    }

    private ChatResponse noEntendi(String original) {
        String cita = original.length() > 90 ? original.substring(0, 90).trim() + "…" : original;
        return new ChatResponse(
                "Leí «" + cita + "», y no es una consulta que pueda resolver. Puedo buscar un producto y su precio, revisar un pedido si ya iniciaste sesión, y explicarte pagos, envíos y devoluciones.",
                MENU, "desconocido");
    }

    private String terminoDe(String texto) {
        Matcher m = BUSQUEDA.matcher(texto);
        String base = m.find() ? m.group(1) : texto;
        String mejor = "";
        for (String p : base.split(" ")) {
            if (p.length() < 3 || esRelleno(p) || p.chars().allMatch(Character::isDigit)) continue;
            if (p.length() > mejor.length()) mejor = p;
        }
        return mejor;
    }

    private static boolean esRelleno(String p) {
        return RELLENO.contains(p) || p.startsWith("busc") || p.startsWith("encuentr") || p.startsWith("muestr")
                || p.startsWith("necesit") || p.startsWith("compr") || p.equals("dame") || p.equals("dime") || p.equals("ver");
    }

    private static boolean parecePalabra(String p) {
        if (p.length() < 3) return false;
        int vocales = 0;
        for (int i = 0; i < p.length(); i++) if ("aeiou".indexOf(p.charAt(i)) >= 0) vocales++;
        return vocales >= 2;
    }

    private String explicar(String estado) {
        return switch (estado) {
            case "PAGADO" -> "Lo estamos preparando para el envío.";
            case "ENVIADO" -> "Ya va en camino.";
            case "ENTREGADO" -> "Ya fue entregado.";
            case "CANCELADO" -> "Fue cancelado y el stock volvió al catálogo.";
            default -> "";
        };
    }

    private ChatResponse simple(String intencion, String texto) {
        return new ChatResponse(texto, List.of("Hablar con un asesor", "Volver al menú"), intencion);
    }

    private String dinero(BigDecimal v) {
        return v == null ? "-" : cop.format(v);
    }

    /** "devol*" coincide con devolver o devolución; "pedido" solo con esa palabra. */
    static boolean aparece(String texto, String clave) {
        boolean stem = clave.endsWith("*");
        String c = stem ? clave.substring(0, clave.length() - 1) : clave;
        if (c.contains(" ")) return texto.contains(c);
        for (String w : texto.split(" ")) {
            if (w.equals(c) || (stem && w.startsWith(c) && w.length() > c.length())) return true;
        }
        return false;
    }

    /** Minúsculas, sin tildes y sin signos: "¿Envíos?" -> "envios" */
    static String normalizar(String s) {
        if (s == null) return "";
        String n = Normalizer.normalize(s.toLowerCase(Locale.ROOT), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return n.replaceAll("[^a-z0-9#ñ ]", " ").replaceAll("\\s+", " ").trim();
    }
}
