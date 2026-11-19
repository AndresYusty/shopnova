package com.shopnova.auth.web.dto;

import com.shopnova.auth.user.Usuario;

public record UsuarioResponse(Long id, String nombre, String email, String rol) {
    public static UsuarioResponse from(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getEmail(), u.getRol().name());
    }
}
