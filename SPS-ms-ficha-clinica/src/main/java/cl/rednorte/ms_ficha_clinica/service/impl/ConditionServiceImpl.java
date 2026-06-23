package cl.rednorte.ms_ficha_clinica.service.impl;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.CodeableConcept;
import org.hl7.fhir.r4.model.Condition;
import org.hl7.fhir.r4.model.IdType;
import org.hl7.fhir.r4.model.Reference;
import org.springframework.stereotype.Service;

import ca.uhn.fhir.rest.client.api.IGenericClient;
import cl.rednorte.ms_ficha_clinica.dto.ConditionDTO;
import cl.rednorte.ms_ficha_clinica.service.ConditionService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
@Data
@Service
@RequiredArgsConstructor
public class ConditionServiceImpl implements ConditionService {

    private final IGenericClient fhirClient;

    @Override
    public ConditionDTO createCondition(ConditionDTO dto) {
        Condition fhirCondition = mapToFhir(dto);
        if (!fhirCondition.hasRecordedDate()) {
            fhirCondition.setRecordedDate(new Date());
        }
        fhirClient.create().resource(fhirCondition).execute();
        return mapToDTO(fhirCondition);
    }

    @Override
    public ConditionDTO getConditionById(String id) {
        try {
            Condition condition = fhirClient.read().resource(Condition.class).withId(id).execute();
            return mapToDTO(condition);
        } catch (Exception e) { return null; }
    }

    @Override
    public List<ConditionDTO> getConditionsByPatientId(String patientId) {
        Bundle response = fhirClient.search().forResource(Condition.class)
                .where(Condition.SUBJECT.hasId("Patient/" + patientId)).returnBundle(Bundle.class).execute();
        return extractList(response);
    }

    @Override
    public List<ConditionDTO> getConditionsByEncounterId(String encounterId) {
        Bundle response = fhirClient.search().forResource(Condition.class)
                .where(Condition.ENCOUNTER.hasId("Encounter/" + encounterId)).returnBundle(Bundle.class).execute();
        return extractList(response);
    }

    @Override
    public List<ConditionDTO> getConditionHistory(String patientId) {
        // En FHIR extraemos todas y luego filtramos, o usamos parámetros de búsqueda si el servidor lo soporta
        return getConditionsByPatientId(patientId);
    }

    @Override
    public void deleteCondition(String id) {
        fhirClient.delete().resourceById(new IdType("Condition", id)).execute();
    }
    private List<ConditionDTO> extractList(Bundle bundle) {
    List<ConditionDTO> list = new ArrayList<>();
    for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
        if (entry.getResource() instanceof Condition) {
            list.add(mapToDTO((Condition) entry.getResource()));
        }
    }
    return list;
}
    // --- MAPPERS ---
    private Condition mapToFhir(ConditionDTO dto) {
    Condition condition = new Condition();
    
    if (dto.getId() != null) condition.setId(dto.getId());
    
    if (dto.getPatientId() != null) {
        condition.setSubject(new Reference("Patient/" + dto.getPatientId()));
    }
    
    if (dto.getEncounterId() != null) {
        condition.setEncounter(new Reference("Encounter/" + dto.getEncounterId()));
    }

    // Mapeamos el código (ej. un código CIE-10) y la descripción
    if (dto.getCode() != null || dto.getDescription() != null) {
        CodeableConcept codeableConcept = new CodeableConcept();
        if (dto.getCode() != null) {
            codeableConcept.addCoding().setCode(dto.getCode()).setDisplay(dto.getDescription());
        } else {
            codeableConcept.setText(dto.getDescription());
        }
        condition.setCode(codeableConcept);
    }
    
    // Mapeamos el ClinicalStatus (ej. active, resolved)
    if (dto.getClinicalStatus() != null) {
        CodeableConcept status = new CodeableConcept();
        status.addCoding()
              .setSystem("http://terminology.hl7.org/CodeSystem/condition-clinical")
              .setCode(dto.getClinicalStatus());
        condition.setClinicalStatus(status);
    }
    
    return condition;
}

private ConditionDTO mapToDTO(Condition condition) {
    ConditionDTO dto = new ConditionDTO();
    
    if (condition.hasIdElement()) {
        dto.setId(condition.getIdElement().getIdPart());
    }
    
    if (condition.hasSubject()) {
        dto.setPatientId(condition.getSubject().getReferenceElement().getIdPart());
    }
    
    if (condition.hasEncounter()) {
        dto.setEncounterId(condition.getEncounter().getReferenceElement().getIdPart());
    }
    
    if (condition.hasCode() && !condition.getCode().getCoding().isEmpty()) {
        dto.setCode(condition.getCode().getCodingFirstRep().getCode());
        dto.setDescription(condition.getCode().getCodingFirstRep().getDisplay());
    } else if (condition.hasCode() && condition.getCode().hasText()) {
        dto.setDescription(condition.getCode().getText());
    }
    
    if (condition.hasClinicalStatus() && !condition.getClinicalStatus().getCoding().isEmpty()) {
        dto.setClinicalStatus(condition.getClinicalStatus().getCodingFirstRep().getCode());
    }
    
    return dto;
}
}