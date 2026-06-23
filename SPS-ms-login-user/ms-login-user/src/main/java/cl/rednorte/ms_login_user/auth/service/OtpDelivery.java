package cl.rednorte.ms_login_user.auth.service;

/**
 * Abstracción de envío de OTP al canal del paciente. En dev se usa
 * {@link LoggingOtpDelivery} (loguea). En prod se inyectarán
 * implementaciones reales (SMS vía Twilio, Email vía SMTP, etc.).
 */
public interface OtpDelivery {

    enum Channel { SMS, EMAIL }

    /**
     * @param channel    canal por el que se envía
     * @param destination teléfono o email del paciente
     * @param otp        OTP en claro (NO loguear en prod)
     */
    void send(Channel channel, String destination, String otp);
}
