package cl.rednorte.ms_login_user.security;

import ca.uhn.fhir.context.FhirContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.hl7.fhir.r4.model.OperationOutcome;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 403 con cuerpo {@link OperationOutcome} en FHIR R4 JSON cuando el
 * usuario está autenticado pero no tiene permiso sobre el recurso.
 */
@Component
@RequiredArgsConstructor
public class FhirAccessDeniedHandler implements AccessDeniedHandler {

    private final FhirContext fhirContext;

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException ex) throws IOException {
        OperationOutcome oo = new OperationOutcome();
        oo.addIssue()
                .setSeverity(OperationOutcome.IssueSeverity.ERROR)
                .setCode(OperationOutcome.IssueType.FORBIDDEN)
                .setDiagnostics("No tiene permiso para acceder a este recurso");
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(fhirContext.newJsonParser().encodeResourceToString(oo));
    }
}
