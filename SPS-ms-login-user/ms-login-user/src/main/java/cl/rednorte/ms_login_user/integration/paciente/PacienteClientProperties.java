package cl.rednorte.ms_login_user.integration.paciente;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Configuración del cliente HTTP hacia ms-paciente.
 * Defaults a localhost:8002; en prod se inyecta por env.
 */
@Data
@ConfigurationProperties(prefix = "app.paciente")
public class PacienteClientProperties {

    /** URL base de ms-paciente (sin slash final). */
    private String baseUrl = "http://localhost:8002";

    /** Bearer token de servicio (rol INTEGRACION) para llamar a /internal/**. */
    private String token;

    private Duration connectTimeout = Duration.ofSeconds(2);
    private Duration readTimeout = Duration.ofSeconds(5);
}
