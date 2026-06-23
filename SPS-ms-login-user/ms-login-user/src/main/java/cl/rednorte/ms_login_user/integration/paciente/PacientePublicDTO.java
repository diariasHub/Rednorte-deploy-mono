package cl.rednorte.ms_login_user.integration.paciente;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Réplica del DTO público que devuelve ms-paciente en
 * {@code /internal/patients/by-rut/{rut}}. {@code ignoreUnknown=true} para
 * tolerar evolución del contrato del emisor sin romper este consumidor.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PacientePublicDTO(
        String id,
        String identifierType,
        String identifierValue,
        String firstName,
        String lastName,
        String phone,
        String email
) {}
