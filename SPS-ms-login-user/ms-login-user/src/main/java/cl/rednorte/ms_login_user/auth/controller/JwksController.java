package cl.rednorte.ms_login_user.auth.controller;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Expone el JWK set público en {@code /.well-known/jwks.json} para que
 * los Resource Servers (ms-usuarios, ms-paciente, etc.) puedan validar
 * los tokens emitidos por este MS.
 *
 * Solo se activa cuando el MS emite tokens propios (perfil dev). En prod
 * el JWK set lo publica el IdP corporativo.
 */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.security.jwt.dev-keypair-enabled", havingValue = "true")
public class JwksController {

    private final RSAKey rsaKey;

    @GetMapping(value = "/.well-known/jwks.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> jwks() {
        // Importante: toPublicJWK() expone solo la parte pública (n, e, kid, kty, alg, use).
        // Sin esto se filtraría la clave privada.
        JWKSet publicSet = new JWKSet(rsaKey.toPublicJWK());
        return ResponseEntity.ok(publicSet.toJSONObject());
    }
}
