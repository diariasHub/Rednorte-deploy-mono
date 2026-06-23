package cl.rednorte.ms_login_user.integration.paciente;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@RequiredArgsConstructor
public class PacienteClientConfig {

    private final PacienteClientProperties properties;
    /** En dev viene de {@link ServiceTokenProvider}. En prod puede no existir. */
    private final ObjectProvider<ServiceTokenProvider> serviceTokenProvider;

    @Bean(name = "pacienteRestClient")
    public RestClient pacienteRestClient() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) properties.getConnectTimeout().toMillis());
        factory.setReadTimeout((int) properties.getReadTimeout().toMillis());

        RestClient.Builder builder = RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(factory);

        // Estrategia de auth (en orden de precedencia):
        // 1. Si hay un token explícito en propiedades → header fijo.
        // 2. Si hay ServiceTokenProvider (dev) → interceptor con token rotado.
        // 3. Si no hay nada → sin Authorization (404/401 esperado).
        if (properties.getToken() != null && !properties.getToken().isBlank()) {
            builder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getToken());
        } else {
            ServiceTokenProvider provider = serviceTokenProvider.getIfAvailable();
            if (provider != null) {
                builder.requestInterceptor((req, body, execution) -> {
                    req.getHeaders().setBearerAuth(provider.getToken());
                    return execution.execute(req, body);
                });
            }
        }
        return builder.build();
    }
}
