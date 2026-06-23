package cl.rednorte.ms_login_user.fhir;

import ca.uhn.fhir.context.FhirContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Singleton {@link FhirContext} para serializar {@code OperationOutcome}
 * en las respuestas de error de auth. NO incluye {@code IGenericClient} —
 * ms-login-user no habla con el HAPI central; eso le toca a ms-usuarios.
 */
@Configuration
public class FhirContextConfig {

    @Bean
    public FhirContext fhirContext() {
        return FhirContext.forR4();
    }
}
