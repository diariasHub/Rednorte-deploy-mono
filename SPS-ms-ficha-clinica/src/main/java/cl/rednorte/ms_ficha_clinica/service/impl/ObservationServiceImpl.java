package cl.rednorte.ms_ficha_clinica.service.impl;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.DateTimeType;
import org.hl7.fhir.r4.model.IdType;
import org.hl7.fhir.r4.model.Observation;
import org.hl7.fhir.r4.model.Quantity;
import org.hl7.fhir.r4.model.Reference;
import org.springframework.stereotype.Service;

import ca.uhn.fhir.rest.client.api.IGenericClient;
import cl.rednorte.ms_ficha_clinica.dto.ObservationDTO;
import cl.rednorte.ms_ficha_clinica.exception.ResourceNotFoundException;
import cl.rednorte.ms_ficha_clinica.service.ObservationService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ObservationServiceImpl implements ObservationService {

    private final IGenericClient fhirClient;

    @Override
    public ObservationDTO createObservation(ObservationDTO dto) {
        Observation fhirObs = mapToFhir(dto);
        if (!fhirObs.hasEffectiveDateTimeType()) {
            fhirObs.setEffective(new DateTimeType(new Date()));
        }
        fhirClient.create().resource(fhirObs).execute();
        return mapToDTO(fhirObs);
    }

    @Override
    public ObservationDTO getObservationById(String id) {
        try {
            Observation obs = fhirClient.read().resource(Observation.class).withId(id).execute();
            return mapToDTO(obs);
        } catch (Exception e) {
            throw new ResourceNotFoundException("Observation not found with id: " + id);
        }
    }

    @Override
    public List<ObservationDTO> getAllObservations() {
        // En FHIR generalmente no pedimos TODO sin filtros, pero si es necesario:
        Bundle response = fhirClient.search().forResource(Observation.class).returnBundle(Bundle.class).execute();
        return extractListFromBundle(response);
    }

    @Override
    public List<ObservationDTO> getObservationsByPatientId(String patientId) {
        Bundle response = fhirClient.search()
                .forResource(Observation.class)
                .where(Observation.SUBJECT.hasId("Patient/" + patientId))
                .returnBundle(Bundle.class)
                .execute();
        return extractListFromBundle(response);
    }

    @Override
    public List<ObservationDTO> getObservationsByEncounterId(String encounterId) {
        Bundle response = fhirClient.search()
                .forResource(Observation.class)
                .where(Observation.ENCOUNTER.hasId("Encounter/" + encounterId))
                .returnBundle(Bundle.class)
                .execute();
        return extractListFromBundle(response);
    }

    @Override
    public List<ObservationDTO> getObservationHistory(String patientId) {
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.YEAR, -1);
        
        Bundle response = fhirClient.search()
                .forResource(Observation.class)
                .where(Observation.SUBJECT.hasId("Patient/" + patientId))
                // Filtro de fecha en FHIR: mayor o igual a hace un año
                .where(Observation.DATE.afterOrEquals().day(cal.getTime())) 
                .returnBundle(Bundle.class)
                .execute();
        return extractListFromBundle(response);
    }
    private List<ObservationDTO> extractListFromBundle(Bundle bundle) {
        List<ObservationDTO> list = new ArrayList<>();
        for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
            if (entry.getResource() instanceof Observation) {
                list.add(mapToDTO((Observation) entry.getResource()));
            }
        }
        return list;
    }

    @Override
    public ObservationDTO updateObservation(String id, ObservationDTO dto) {
        Observation fhirObs = mapToFhir(dto);
        fhirObs.setId(id); // Forzamos el ID original
        fhirClient.update().resource(fhirObs).execute();
        return mapToDTO(fhirObs);
    }

    @Override
    public void deleteObservation(String id) {
        fhirClient.delete().resourceById(new IdType("Observation", id)).execute();
    }

    // --- MAPPERS INTERNOS ---
    private Observation mapToFhir(ObservationDTO dto) {
        Observation obs = new Observation();
        if (dto.getId() != null) obs.setId(dto.getId());
        if (dto.getPatientId() != null) obs.setSubject(new Reference("Patient/" + dto.getPatientId()));
        if (dto.getEncounterId() != null) obs.setEncounter(new Reference("Encounter/" + dto.getEncounterId()));
        if (dto.getEffectiveDate() != null) obs.setEffective(new DateTimeType(dto.getEffectiveDate()));
        
        // Código de la observación (Ej: Presión, Temperatura)
        if (dto.getCode() != null) {
            obs.getCode().addCoding().setCode(dto.getCode()).setDisplay(dto.getCode());
        }
        
        // ¡Corregido! Como dto.getValue() es Double, lo transformamos de forma segura a BigDecimal para el Quantity de FHIR
        if (dto.getValue() != null) {
            Quantity quantity = new Quantity();
            quantity.setValue(java.math.BigDecimal.valueOf(dto.getValue()));
            if (dto.getUnit() != null) quantity.setUnit(dto.getUnit());
            obs.setValue(quantity);
        }
        return obs;
    }

    private ObservationDTO mapToDTO(Observation obs) {
        ObservationDTO dto = new ObservationDTO();
        if (obs.hasIdElement()) dto.setId(obs.getIdElement().getIdPart());
        if (obs.hasSubject()) dto.setPatientId(obs.getSubject().getReferenceElement().getIdPart());
        if (obs.hasEncounter()) dto.setEncounterId(obs.getEncounter().getReferenceElement().getIdPart());
        if (obs.hasEffectiveDateTimeType()) dto.setEffectiveDate(obs.getEffectiveDateTimeType().getValue());
        
        if (obs.hasCode() && !obs.getCode().getCoding().isEmpty()) {
            dto.setCode(obs.getCode().getCodingFirstRep().getCode());
        }
        
        // ¡Corregido! Extraemos el valor desde FHIR y lo convertimos al Double que espera tu DTO
        if (obs.hasValueQuantity() && obs.getValueQuantity().getValue() != null) {
            dto.setValue(obs.getValueQuantity().getValue().doubleValue());
            dto.setUnit(obs.getValueQuantity().getUnit());
        } else if (obs.hasValueStringType() && obs.getValueStringType().getValue() != null) {
            // Por si acaso el servidor FHIR guardó el número como un String plano
            try {
                dto.setValue(Double.parseDouble(obs.getValueStringType().getValue()));
            } catch (NumberFormatException e) {
                dto.setValue(null); // Si el texto no es un número válido, lo dejamos nulo para evitar caídas
            }
        }
        return dto;
    }
}