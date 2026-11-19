package com.shopnova.auth.user;

import com.shopnova.auth.security.JwtService;
import com.shopnova.auth.web.dto.AuthResponse;
import com.shopnova.auth.web.dto.LoginRequest;
import com.shopnova.auth.web.dto.RegisterRequest;
import com.shopnova.auth.web.dto.UsuarioResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UsuarioRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UsuarioRepository repo, PasswordEncoder encoder, JwtService jwt) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (repo.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El correo ya está registrado");
        }
        // Todo registro público crea un CLIENTE: el rol nunca se toma del cliente (evita escalada de privilegios)
        Usuario u = repo.save(new Usuario(req.nombre().trim(), email, encoder.encode(req.password()), Rol.CLIENTE));
        return toAuth(u);
    }

    public AuthResponse login(LoginRequest req) {
        Usuario u = repo.findByEmailIgnoreCase(req.email().trim())
                .filter(x -> encoder.matches(req.password(), x.getPassword()))
                // Mensaje genérico: no revela si el correo existe (evita enumeración de usuarios)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));
        return toAuth(u);
    }

    public UsuarioResponse me(Long id) {
        return repo.findById(id).map(UsuarioResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }

    private AuthResponse toAuth(Usuario u) {
        String token = jwt.generate(u.getId(), u.getEmail(), u.getRol().name());
        return new AuthResponse(token, "Bearer", jwt.getExpirationMs() / 1000, UsuarioResponse.from(u));
    }
}
