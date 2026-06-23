package cl.rednorte.ms_login_user.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpVerifyRequest(
        @NotBlank String mfaChallenge,
        @NotBlank @Pattern(regexp = "\\d{6}") String code
) {}
