package com.shopnova.catalog.security;

/** Usuario autenticado extraído del JWT. */
public record AuthUser(Long id, String email, String rol) {
    public boolean isAdmin() {
        return "ADMIN".equals(rol);
    }
}
