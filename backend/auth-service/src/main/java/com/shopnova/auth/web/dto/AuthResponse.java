package com.shopnova.auth.web.dto;

public record AuthResponse(String token, String tipo, long expiraEnSegundos, UsuarioResponse usuario) {
}
