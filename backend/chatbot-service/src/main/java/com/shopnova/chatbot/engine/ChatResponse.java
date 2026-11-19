package com.shopnova.chatbot.engine;

import java.util.List;

/** Respuesta del bot: texto, botones de opciones sugeridas y la intención detectada. */
public record ChatResponse(String respuesta, List<String> opciones, String intencion) {
}
