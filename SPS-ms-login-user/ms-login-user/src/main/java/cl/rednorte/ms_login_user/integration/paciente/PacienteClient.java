package cl.rednorte.ms_login_user.integration.paciente;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.Optional;

/**
 * Cliente HTTP hacia {@code GET /internal/patients/by-rut/{rut}} en
 * ms-paciente. Envuelto con Resilience4j (instance "paciente").
 *
 * 404 → {@link Optional#empty()}; otros 4xx/5xx burbujean.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PacienteClient {

    public static final String CB_NAME = "paciente";

    private final RestClient pacienteRestClient;

    @CircuitBreaker(name = CB_NAME)
    @Retry(name = CB_NAME)
    public Optional<PacientePublicDTO> findByRut(String rut) {
        try {
            PacientePublicDTO dto = pacienteRestClient.get()
                    .uri("/internal/patients/by-rut/{rut}", rut)
                    .retrieve()
                    .body(PacientePublicDTO.class);
            return Optional.ofNullable(dto);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().equals(HttpStatusCode.valueOf(404))) {
                return Optional.empty();
            }
            log.warn("ms-paciente respondió error consultando RUT={}: {}", rut, e.getStatusCode());
            throw e;
        }
    }
}
