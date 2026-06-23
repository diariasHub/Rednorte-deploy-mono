package cl.rednorte.ms_login_user.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PatientOtpVerifyRequest(
        @NotBlank @Pattern(regexp = "\\d{7,8}-[\\dkK]") String rut,
        @NotBlank @Pattern(regexp = "\\d{6}") String code
) {}
