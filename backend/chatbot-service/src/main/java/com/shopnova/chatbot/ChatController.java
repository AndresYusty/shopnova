package com.shopnova.chatbot;

import com.shopnova.chatbot.client.HttpLookups;
import com.shopnova.chatbot.engine.ChatResponse;
import com.shopnova.chatbot.engine.ChatbotEngine;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@Tag(name = "Chatbot")
public class ChatController {

    public record ChatRequest(@NotBlank @Size(max = 300) String mensaje,
                              @Size(max = 1500) String contexto) {
    }

    private final ChatbotEngine engine;

    public ChatController(HttpLookups lookups) {
        this.engine = new ChatbotEngine(lookups, lookups);
    }

    @PostMapping
    @Operation(summary = "Enviar un mensaje al asistente virtual",
            description = "Público. Si se envía el JWT en Authorization, el bot puede consultar el estado de los pedidos del usuario.")
    public ChatResponse chat(@Valid @RequestBody ChatRequest req,
                             @RequestHeader(value = "Authorization", required = false) String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ") ? authorization : null;
        return engine.responder(req.mensaje(), token, req.contexto());
    }

    @GetMapping("/menu")
    @Operation(summary = "Opciones iniciales del asistente")
    public ChatResponse menu() {
        return engine.responder("hola", null);
    }
}
