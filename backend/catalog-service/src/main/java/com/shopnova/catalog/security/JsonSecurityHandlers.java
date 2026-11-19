package com.shopnova.catalog.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;

import java.io.IOException;
import java.time.Instant;

/** Respuestas JSON uniformes para 401 (no autenticado) y 403 (sin permisos). */
public final class JsonSecurityHandlers {

    private JsonSecurityHandlers() {
    }

    public static AuthenticationEntryPoint unauthorized() {
        return (req, res, ex) -> write(res, 401, "No autenticado: token ausente, inválido o expirado");
    }

    public static AccessDeniedHandler forbidden() {
        return (req, res, ex) -> write(res, 403, "No tiene permisos para este recurso");
    }

    private static void write(HttpServletResponse res, int status, String msg) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"status\":" + status + ",\"error\":\"" + msg + "\",\"timestamp\":\"" + Instant.now() + "\"}");
    }
}
