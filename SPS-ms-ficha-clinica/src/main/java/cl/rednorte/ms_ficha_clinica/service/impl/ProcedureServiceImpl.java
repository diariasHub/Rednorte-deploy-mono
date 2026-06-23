package cl.rednorte.ms_ficha_clinica.service.impl;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.DateTimeType;
import org.hl7.fhir.r4.model.IdType;
import org.hl7.fhir.r4.model.Procedure;
import org.springframework.stereotype.Service;

import ca.uhn.fhir.rest.client.api.IGenericClient;
import cl.rednorte.ms_ficha_clinica.dto.ProcedureDTO;
import cl.rednorte.ms_ficha_clinica.service.ProcedureService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProcedureServiceImpl implements ProcedureService {

    private final IGenericClient fhirClient;

    @Override
    public ProcedureDTO createProcedure(ProcedureDTO procedureDTO) {
        Procedure fhirProcedure = mapToFhir(procedureDTO);
        
        // Si no trae fecha, le asignamos la fecha y hora actual
        if (!fhirProcedure.hasPerformedDateTimeType()) {
            fhirProcedure.setPerformed(new DateTimeType(new Date()));
        }
        
        // FHIR exige un status para los procedimientos. Si no viene en tu DTO, asumimos que se completó.
        if (!fhirProcedure.hasStatus()) {
            fhirProcedure.setStatus(Procedure.ProcedureStatus.COMPLETED);
        }

        fhirClient.create().resource(fhirProcedure).execute();
        return mapToDTO(fhirProcedure);
    }

    @Override
    public ProcedureDTO getProcedureById(String id) {
        try {
            Procedure procedure = fhirClient.read().resource(Procedure.class).withId(id).execute();
            return mapToDTO(procedure);
        } catch (Exception e) {
            return null; // Retorna null si no se encuentra (código 404 en FHIR)
        }
    }

    @Override
    public List<ProcedureDTO> getProceduresByPatientId(String patientId) {
        Bundle response = fhirClient.search().forResource(Procedure.class)
                .where(Procedure.SUBJECT.hasId("Patient/" + patientId))
                .returnBundle(Bundle.class)
                .execute();
        return extractList(response);
    }

    @Override
    public List<ProcedureDTO> getProceduresByEncounterId(String encounterId) {
        Bundle response = fhirClient.search().forResource(Procedure.class)
                .where(Procedure.ENCOUNTER.hasId("Encounter/" + encounterId))
                .returnBundle(Bundle.class)
                .execute();
        return extractList(response);
    }

    @Override
    public void deleteProcedure(String id) {
        fhirClient.delete().resourceById(new IdType("Procedure", id)).execute();
    }

    // --- MAPPERS ---
    private List<ProcedureDTO> extractList(Bundle bundle) {
        List<ProcedureDTO> list = new ArrayList<>();
        for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
            if (entry.getResource() instanceof Procedure) {
                list.add(mapToDTO((Procedure) entry.getResource()));
            }
        }
        return list;
    }

    private Procedure mapToFhir(ProcedureDTO dto) {
        Procedure procedure = new Procedure();
        
        if (dto.getId() != null) procedure.setId(dto.getId());
        
        // Descomenta y ajusta estos campos según los nombres exactos en tu ProcedureDTO
        // if (dto.getPatientId() != null) procedure.setSubject(new Reference("Patient/" + dto.getPatientId()));
        // if (dto.getEncounterId() != null) procedure.setEncounter(new Reference("Encounter/" + dto.getEncounterId()));
        // if (dto.getPerformedDate() != null) procedure.setPerformed(new DateTimeType(dto.getPerformedDate()));
        
        return procedure;
    }

    private ProcedureDTO mapToDTO(Procedure procedure) {
        ProcedureDTO dto = new ProcedureDTO();
        
        if (procedure.hasIdElement()) dto.setId(procedure.getIdElement().getIdPart());
        
        // Descomenta y ajusta estos campos según los nombres exactos en tu ProcedureDTO
        // if (procedure.hasSubject()) dto.setPatientId(procedure.getSubject().getReferenceElement().getIdPart());
        // if (procedure.hasEncounter()) dto.setEncounterId(procedure.getEncounter().getReferenceElement().getIdPart());
        // if (procedure.hasPerformedDateTimeType()) dto.setPerformedDate(procedure.getPerformedDateTimeType().getValue());
        
        return dto;
    }
}