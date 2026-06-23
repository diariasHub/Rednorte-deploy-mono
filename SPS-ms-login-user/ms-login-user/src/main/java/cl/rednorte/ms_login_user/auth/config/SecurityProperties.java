package cl.rednorte.ms_login_user.auth.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

    private Jwt jwt = new Jwt();
    private Lockout lockout = new Lockout();
    private Otp otp = new Otp();
    private PatientOtp patientOtp = new PatientOtp();
    private RateLimit rateLimit = new RateLimit();

    @Data
    public static class Jwt {
        private String issuer = "ms-usuarios";
        private int accessTokenTtlMinutes = 10;
        private int refreshTokenTtlHours = 8;
        private boolean devKeypairEnabled = false;
    }

    @Data
    public static class Lockout {
        private int maxAttempts = 5;
        private int lockMinutes = 15;
    }

    @Data
    public static class Otp {
        private String issuer = "RedNorte-Urgencias";
        private int digits = 6;
        private int periodSeconds = 30;
        private int allowedDiscrepancy = 1;
    }

    /**
     * Rate limit por IP en endpoints sensibles. Defaults sin límite efectivo
     * (10k) para dev/tests; producción los baja vía override a 10/min/IP.
     */
    @Data
    public static class RateLimit {
        private int loginAttempts = 10_000;
        private int otpAttempts = 10_000;
        private int patientOtpAttempts = 10_000;
        private int windowSeconds = 60;
    }

    /** Auto-login del paciente con OTP (RUT + código). */
    @Data
    public static class PatientOtp {
        private int ttlMinutes = 5;
        private int length = 6;
        private int maxAttempts = 3;
        /** Si true, /auth/patient/request-otp devuelve el OTP en el cuerpo (solo dev/smoke). */
        private boolean exposeInResponse = false;
        /** Duración del token emitido tras verificar OTP. Sin refresh. */
        private int patientTokenTtlMinutes = 10;
    }
}
