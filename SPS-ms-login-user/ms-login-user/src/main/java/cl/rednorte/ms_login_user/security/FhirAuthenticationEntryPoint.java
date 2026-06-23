package cl.rednorte.ms_login_user.security;

import ca.uhn.fhir.context.FhirContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.hl7.fhir.r4.model.OperationOutcome;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 401 con cuerpo {@link OperationOutcome} serializado en FHIR R4 JSON.
 */
@Component
@RequiredArgsConstructor
public class FhirAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final FhirContext fhirContext;

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException ex) throws IOException {
        OperationOutcome oo = new OperationOutcome();
        oo.addIssue()
                .setSeverity(OperationOutcome.IssueSeverity.ERROR)
                .setCode(OperationOutcome.IssueType.LOGIN)
                .setDiagnostics("Autenticación requerida o credenciales inválidas");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(fhirContext.newJsonParser().encodeResourceToString(oo));
    }
}
