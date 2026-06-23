package cl.rednorte.ms_login_user.auth.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Política CORS configurable por env var. Default sin orígenes permitidos
 * (= bloqueado en prod). En dev, override por application-dev.yaml.
 */
@Data
@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {

    private List<String> allowedOrigins = List.of();
    private List<String> allowedMethods = List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
    private List<String> allowedHeaders = List.of("Authorization", "Content-Type", "X-Break-Glass", "X-Break-Glass-Reason");
    private boolean allowCredentials = true;
    private long maxAgeSeconds = 3600;
}
