package cl.rednorte.ms.red.centros.controller;

import ca.uhn.fhir.rest.client.api.IGenericClient;
import org.hl7.fhir.r4.model.Organization;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;




@RestController
@RequestMapping("/centros")

public class CentroController {
    
    private final IGenericClient client;
    public CentroController(IGenericClient client) {
        this.client = client;
    }

    @PostMapping("/organizacion")
    public String createOrganization(@RequestBody String name) {
        Organization org = new Organization();
        org.setName(name);
        
        return client.create()
                     .resource(org)
                     .execute()
                     .getId()
                     .getIdPart();
    }
    
    @GetMapping("/{id}")
    public Organization getById(@PathVariable String id) {
        return client.read()
                     .resource(Organization.class)
                     .withId(id)
                     .execute();

    }
    

}
