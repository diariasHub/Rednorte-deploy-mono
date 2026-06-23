package cl.rednorte.ms_login_user.auth.controller;

import ca.uhn.fhir.context.FhirContext;
import lombok.RequiredArgsConstructor;
import org.hl7.fhir.r4.model.OperationOutcome;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Convierte las excepciones de autenticación lanzadas desde los controllers
 * (AuthController, FHIR controllers) a respuestas FHIR {@code OperationOutcome}.
 * Las del SecurityFilterChain las maneja {@code FhirAuthenticationEntryPoint}.
 *
 * Se activa solo cuando el MS emite tokens propios (perfil dev).
 */
@Order(Integer.MIN_VALUE) // Antes que GlobalExceptionHandler genérico
@RestControllerAdvice
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.security.jwt.dev-keypair-enabled", havingValue = "true")
public class AuthExceptionAdvice {

    private final FhirContext fhirContext;

    @ExceptionHandler({BadCredentialsException.class, DisabledException.class, LockedException.class})
    public ResponseEntity<String> handleAuth(RuntimeException ex) {
        return fhirError(401, OperationOutcome.IssueType.LOGIN, ex.getMessage());
    }

    private ResponseEntity<String> fhirError(int status, OperationOutcome.IssueType type, String diagnostics) {
        OperationOutcome oo = new OperationOutcome();
        oo.addIssue()
                .setSeverity(OperationOutcome.IssueSeverity.ERROR)
                .setCode(type)
                .setDiagnostics(diagnostics);
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(fhirContext.newJsonParser().encodeResourceToString(oo));
    }
}
