package cl.rednorte.ms_login_user.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;

/**
 * Implementación dev de {@link OtpDelivery}: loguea el OTP al WARN del
 * application log. NO usar en producción: el OTP no debe quedar en logs
 * persistentes. En prod, registrar otro bean (SmsOtpDelivery,
 * EmailOtpDelivery) y este queda fuera vía {@code @ConditionalOnMissingBean}.
 */
@Slf4j
@Configuration
public class LoggingOtpDelivery {

    @Bean
    @ConditionalOnMissingBean(OtpDelivery.class)
    public OtpDelivery devLoggingOtpDelivery() {
        return (channel, destination, otp) ->
                log.warn("[DEV-OTP] channel={} destination={} otp={} " +
                                "(NO usar en prod: este log filtra el OTP en claro)",
                        channel, destination, otp);
    }
}
