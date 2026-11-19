package com.shopnova.auth.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Crea el usuario administrador inicial si no existe. */
@Component
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final UsuarioRepository repo;
    private final PasswordEncoder encoder;
    private final String email;
    private final String password;

    public AdminSeeder(UsuarioRepository repo, PasswordEncoder encoder,
                       @Value("${app.admin.email}") String email,
                       @Value("${app.admin.password}") String password) {
        this.repo = repo;
        this.encoder = encoder;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (!repo.existsByEmailIgnoreCase(email)) {
            repo.save(new Usuario("Administrador", email, encoder.encode(password), Rol.ADMIN));
            log.info("Usuario administrador creado: {}", email);
        }
    }
}
