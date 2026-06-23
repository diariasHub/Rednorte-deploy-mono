package cl.rednorte.ms_login_user.auth.dto;

/**
 * Respuesta al login cuando el usuario tiene MFA habilitado.
 * El cliente debe enviar el {@code mfaChallenge} junto al código OTP
 * a {@code POST /auth/otp} para completar la autenticación.
 */
public record LoginChallengeResponse(
        String mfaChallenge,
        String status
) implements LoginResult {
    public static LoginChallengeResponse required(String challenge) {
        return new LoginChallengeResponse(challenge, "MFA_REQUIRED");
    }
}
