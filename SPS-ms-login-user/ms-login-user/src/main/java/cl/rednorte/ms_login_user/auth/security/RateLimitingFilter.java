package cl.rednorte.ms_login_user.auth.security;

import ca.uhn.fhir.context.FhirContext;
import cl.rednorte.ms_login_user.auth.config.SecurityProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hl7.fhir.r4.model.OperationOutcome;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limit por IP en endpoints sensibles de auth: login, MFA OTP, y
 * solicitud/verificación de OTP del paciente. Segunda línea de defensa
 * frente a fuerza bruta distribuida; el lockout por usuario protege contra
 * ataque dirigido a una cuenta.
 *
 * Backend en memoria con {@link ConcurrentHashMap}; migrable a Redis si
 * el MS se escala horizontalmente.
 */
@Slf4j
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final SecurityProperties securityProperties;
    private final FhirContext fhirContext;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        String path = request.getRequestURI();
        int capacity = capacityFor(path);
        if (capacity <= 0) {
            chain.doFilter(request, response);
            return;
        }
        Duration window = Duration.ofSeconds(securityProperties.getRateLimit().getWindowSeconds());
        String key = clientIp(request) + ":" + path;
        Bucket bucket = buckets.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(capacity).refillIntervally(capacity, window).build())
                .build());

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
            return;
        }

        log.warn("Rate limit excedido ip={} path={}", clientIp(request), path);
        writeTooManyRequests(response);
    }

    private int capacityFor(String path) {
        SecurityProperties.RateLimit rl = securityProperties.getRateLimit();
        return switch (path) {
            case "/auth/login" -> rl.getLoginAttempts();
            case "/auth/otp" -> rl.getOtpAttempts();
            case "/auth/patient/request-otp", "/auth/patient/verify-otp" -> rl.getPatientOtpAttempts();
            default -> 0;
        };
    }

    private void writeTooManyRequests(HttpServletResponse response) throws IOException {
        OperationOutcome oo = new OperationOutcome();
        oo.addIssue()
                .setSeverity(OperationOutcome.IssueSeverity.ERROR)
                .setCode(OperationOutcome.IssueType.THROTTLED)
                .setDiagnostics("Demasiados intentos. Espere antes de reintentar.");
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(fhirContext.newJsonParser().encodeResourceToString(oo));
    }

    private String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
