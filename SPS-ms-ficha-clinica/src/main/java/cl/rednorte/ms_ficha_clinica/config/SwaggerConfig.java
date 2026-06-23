package cl.rednorte.ms_ficha_clinica.config;

import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    static {
        // Usamos Void.class para cegar a Swagger y que no entre en el bucle infinito de FHIR
        SpringDocUtils.getConfig().replaceWithClass(org.hl7.fhir.instance.model.api.IBaseResource.class, Void.class);
        SpringDocUtils.getConfig().replaceWithClass(ca.uhn.fhir.context.FhirContext.class, Void.class);
        SpringDocUtils.getConfig().replaceWithClass(org.hl7.fhir.r4.model.Base.class, Void.class);
        SpringDocUtils.getConfig().replaceWithClass(org.hl7.fhir.r4.model.Resource.class, Void.class);
    }
}