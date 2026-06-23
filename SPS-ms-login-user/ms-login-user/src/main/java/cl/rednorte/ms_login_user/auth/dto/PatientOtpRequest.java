package cl.rednorte.ms_login_user.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Solicitud de OTP por RUT. El RUT acepta formato chileno con guión y dv.
 * No se valida el dv aquí (eso lo hace el match contra ms-paciente).
 */
public record PatientOtpRequest(
        @NotBlank @Pattern(regexp = "\\d{7,8}-[\\dkK]") String rut
) {}
