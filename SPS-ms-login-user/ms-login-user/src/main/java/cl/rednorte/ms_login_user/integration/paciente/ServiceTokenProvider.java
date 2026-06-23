package cl.rednorte.ms_login_user.integration.paciente;

import cl.rednorte.ms_login_user.auth.service.JwtService;
import cl.rednorte.ms_login_user.model.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Provee y cachea el JWT que ms-login-user usa para llamarse a otros MS
 * (ms-paciente, etc.) con rol INTEGRACION. Refresca proactivamente unos
 * segundos antes de expirar para evitar el efecto "primera llamada lenta".
 *
 * Solo se activa cuando ms-login-user emite sus propios JWT (perfil dev).
 * En prod, el token de servicio lo provee el IdP corporativo via
 * client_credentials y se inyecta como propiedad.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.security.jwt.dev-keypair-enabled", havingValue = "true")
public class ServiceTokenProvider {

    private static final String SUBJECT = "ms-login-svc";
    private static final Duration TTL = Duration.ofMinutes(15);
    /** Refrescar cuando faltan menos de 60s para expirar. */
    private static final Duration REFRESH_MARGIN = Duration.ofSeconds(60);

    private final JwtService jwtService;

    private volatile String cachedToken;
    private volatile Instant expiresAt = Instant.EPOCH;

    public synchronized String getToken() {
        if (Instant.now().isAfter(expiresAt.minus(REFRESH_MARGIN))) {
            cachedToken = jwtService.issueServiceToken(
                    SUBJECT, List.of("ROLE_" + Role.INTEGRACION), TTL);
            expiresAt = Instant.now().plus(TTL);
            log.debug("Service token refrescado, expira en {}s", TTL.toSeconds());
        }
        return cachedToken;
    }
}
