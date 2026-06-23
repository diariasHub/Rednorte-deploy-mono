package cl.rednorte.ms_login_user.auth.dto;

/**
 * Respuesta a {@code POST /auth/patient/request-otp}. Siempre devuelve
 * {@code status="OTP_SENT"} para no leakear la existencia del RUT.
 * {@code debugOtp} solo se setea cuando
 * {@code app.security.patient-otp.expose-in-response=true} (dev/smoke).
 */
public record PatientOtpRequestResponse(String status, String debugOtp) {
    public static PatientOtpRequestResponse sent() {
        return new PatientOtpRequestResponse("OTP_SENT", null);
    }
    public static PatientOtpRequestResponse sentWithDebug(String otp) {
        return new PatientOtpRequestResponse("OTP_SENT", otp);
    }
}
