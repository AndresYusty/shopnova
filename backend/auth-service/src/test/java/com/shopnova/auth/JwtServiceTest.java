package com.shopnova.auth;

import com.shopnova.auth.security.AuthUser;
import com.shopnova.auth.security.JwtService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private final JwtService jwt = new JwtService("un-secreto-de-pruebas-de-32-caracteres!!", 60_000);

    @Test
    void generaYValidaToken() {
        String token = jwt.generate(7L, "ana@test.com", "CLIENTE");
        AuthUser u = jwt.parse(token).orElseThrow();
        assertEquals(7L, u.id());
        assertEquals("ana@test.com", u.email());
        assertEquals("CLIENTE", u.rol());
    }

    @Test
    void rechazaTokenAlterado() {
        String token = jwt.generate(1L, "a@b.com", "ADMIN") + "x";
        assertTrue(jwt.parse(token).isEmpty());
    }

    @Test
    void rechazaTokenFirmadoConOtroSecreto() {
        JwtService otro = new JwtService("otro-secreto-totalmente-distinto-1234567", 60_000);
        assertTrue(jwt.parse(otro.generate(1L, "a@b.com", "ADMIN")).isEmpty());
    }
}
