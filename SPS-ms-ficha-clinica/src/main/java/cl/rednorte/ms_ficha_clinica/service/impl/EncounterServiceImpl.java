package cl.rednorte.ms_ficha_clinica.service.impl;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.hl7.fhir.r4.model.Appointment;
import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.Coding;
import org.hl7.fhir.r4.model.Encounter;
import org.hl7.fhir.r4.model.IdType;
import org.hl7.fhir.r4.model.Period;
import org.hl7.fhir.r4.model.Reference;
import org.springframework.stereotype.Service;

import ca.uhn.fhir.rest.api.MethodOutcome;
import ca.uhn.fhir.rest.client.api.IGenericClient;
import cl.rednorte.ms_ficha_clinica.dto.EncounterDTO;
import cl.rednorte.ms_ficha_clinica.service.EncounterService;
import lombok.RequiredArgsConstructor;
@Service
@RequiredArgsConstructor
public class EncounterServiceImpl implements EncounterService {

    // ¡Adiós EncounterRepository! Inyectamos el cliente FHIR.
    private final IGenericClient fhirClient;

    @Override
    public EncounterDTO createEncounter(EncounterDTO encounterDTO) {
        // 1. Mapear tu DTO al recurso nativo FHIR org.hl7.fhir.r4.model.Encounter
        Encounter fhirEncounter = mapToFhir(encounterDTO);
        
        if (!fhirEncounter.hasPeriod() || !fhirEncounter.getPeriod().hasStart()) {
            fhirEncounter.getPeriod().setStart(new Date());
        }
        if (!fhirEncounter.hasStatus()) {
            fhirEncounter.setStatus(Encounter.EncounterStatus.INPROGRESS);
        }

        // 2. Ejecutar la operación CREATE en el servidor FHIR
        fhirClient.create()
                .resource(fhirEncounter)
                .execute();

        // Nota: Idealmente deberíamos capturar el ID generado por HAPI FHIR de la respuesta
        // y asignarlo al DTO antes de retornarlo.
        return mapToDTO(fhirEncounter);
    }

    @Override
    public EncounterDTO getEncounterById(String id) {
        try {
            // Operación READ por ID: GET /Encounter/{id}
            Encounter fhirEncounter = fhirClient.read()
                    .resource(Encounter.class)
                    .withId(id)
                    .execute();
                    
            return mapToDTO(fhirEncounter);
        } catch (Exception e) {
            // HAPI lanza ResourceNotFoundException si no existe (código 404)
            return null;
        }
    }

    @Override
    public List<EncounterDTO> getEncountersByPatientId(String patientId) {
        // Operación SEARCH: GET /Encounter?subject=Patient/{patientId}
        Bundle response = fhirClient.search()
                .forResource(Encounter.class)
                .where(Encounter.SUBJECT.hasId("Patient/" + patientId))
                .returnBundle(Bundle.class)
                .execute();

        // Extraer los recursos del Bundle devuelto por FHIR
        List<EncounterDTO> encounters = new ArrayList<>();
        for (Bundle.BundleEntryComponent entry : response.getEntry()) {
            if (entry.getResource() instanceof Encounter) {
                encounters.add(mapToDTO((Encounter) entry.getResource()));
            }
        }
        return encounters;
    }

    @Override
    public EncounterDTO updateStatus(String id, String status) {
        // 1. Primero debemos recuperar el recurso existente
        Encounter fhirEncounter = fhirClient.read().resource(Encounter.class).withId(id).execute();
        
        if (fhirEncounter != null) {
            try {
                // 2. Actualizar el estado (HAPI usa Enums nativos para los status)
                Encounter.EncounterStatus newStatus = Encounter.EncounterStatus.valueOf(status.toUpperCase());
                fhirEncounter.setStatus(newStatus);
                
                if (newStatus == Encounter.EncounterStatus.FINISHED) {
                    fhirEncounter.getPeriod().setEnd(new Date());
                }

                // 3. Ejecutar la operación UPDATE: PUT /Encounter/{id}
                fhirClient.update()
                        .resource(fhirEncounter)
                        .execute();
                        
                return mapToDTO(fhirEncounter);
            } catch (IllegalArgumentException e) {
                // El string proporcionado no mapea a un status FHIR válido
                return null;
            }
        }
        return null;
    }

    @Override
    public void deleteEncounter(String id) {
        // Operación DELETE: DELETE /Encounter/{id}
        fhirClient.delete()
                .resourceById(new IdType("Encounter", id))
                .execute();
    }

    // =========================================================================
    // MÉTODOS DE MAPEO (Tendrás que ajustarlos según los campos de tu DTO)
    // =========================================================================

    private EncounterDTO mapToDTO(Encounter fhirEncounter) {
        EncounterDTO dto = new EncounterDTO();
        
        // El ID en FHIR viene con formato "Encounter/123/_history/1", usamos getIdPart()
        if (fhirEncounter.hasIdElement()) dto.setId(fhirEncounter.getIdElement().getIdPart());
        if (fhirEncounter.hasStatus()) dto.setStatus(fhirEncounter.getStatus().toCode());
        if (fhirEncounter.hasSubject()) dto.setPatientId(fhirEncounter.getSubject().getReferenceElement().getIdPart());
        
        if (fhirEncounter.hasPeriod()) {
            dto.setPeriodStart(fhirEncounter.getPeriod().getStart());
            dto.setPeriodEnd(fhirEncounter.getPeriod().getEnd());
        }
        return dto;
    }

    private Encounter mapToFhir(EncounterDTO dto) {
        Encounter fhirEncounter = new Encounter();
        
        if (dto.getId() != null) fhirEncounter.setId(dto.getId());
        if (dto.getPatientId() != null) fhirEncounter.setSubject(new Reference("Patient/" + dto.getPatientId()));
        
        // Mapeo de Period
        if (dto.getPeriodStart() != null || dto.getPeriodEnd() != null) {
            fhirEncounter.getPeriod().setStart(dto.getPeriodStart());
            fhirEncounter.getPeriod().setEnd(dto.getPeriodEnd());
        }
        
        // Mapeo de Status
        if (dto.getStatus() != null) {
            try {
                fhirEncounter.setStatus(Encounter.EncounterStatus.fromCode(dto.getStatus().toLowerCase()));
            } catch (Exception e) {
                fhirEncounter.setStatus(Encounter.EncounterStatus.UNKNOWN);
            }
        }
        return fhirEncounter;
    }
    @Override
    public EncounterDTO startEncounterFromAppointment(String appointmentId) {
        
        // 1. Leer la cita original desde FHIR
        Appointment cita = fhirClient.read()
                .resource(Appointment.class)
                .withId(appointmentId)
                .execute();

        // 2. Extraer el Paciente y el Médico de los participantes de la cita
        Reference refPaciente = null;
        Reference refMedico = null;

        for (Appointment.AppointmentParticipantComponent participante : cita.getParticipant()) {
            if (participante.getActor().getReference() != null) {
                if (participante.getActor().getReference().startsWith("Patient/")) {
                    refPaciente = participante.getActor();
                } else if (participante.getActor().getReference().startsWith("Practitioner/")) {
                    refMedico = participante.getActor();
                }
            }
        }

        if (refPaciente == null) {
            throw new RuntimeException("La cita no tiene un paciente válido asignado.");
        }

        // 3. Crear el nuevo Encuentro Clínico (Encounter)
        Encounter encuentro = new Encounter();
        encuentro.setStatus(Encounter.EncounterStatus.INPROGRESS); 
        
        // Clasificación: AMB (Ambulatorio)
        Coding claseAmbulatoria = new Coding()
                .setSystem("http://terminology.hl7.org/CodeSystem/v3-ActCode")
                .setCode("AMB")
                .setDisplay("ambulatory");
        encuentro.setClass_(claseAmbulatoria);

        // Enlazar Paciente y Médico
        encuentro.setSubject(refPaciente);
        if (refMedico != null) {
            Encounter.EncounterParticipantComponent participanteEncuentro = new Encounter.EncounterParticipantComponent();
            participanteEncuentro.setIndividual(refMedico);
            encuentro.addParticipant(participanteEncuentro);
        }

        // Enlazar la Cita Original para trazabilidad
        encuentro.addAppointment(new Reference("Appointment/" + appointmentId));

        // Registrar la hora de inicio real
        Period periodo = new Period();
        periodo.setStart(new Date());
        encuentro.setPeriod(periodo);

        // 4. Guardar en el servidor FHIR
        MethodOutcome resultado = fhirClient.create()
                .resource(encuentro)
                .execute();

        String idEncuentroCreado = resultado.getId().getIdPart();

        // 5. Mapear y retornar tu EncounterDTO
        // NOTA: Ajusta esto según cómo esté construido tu EncounterDTO (setters, constructores o builders)
        EncounterDTO dto = new EncounterDTO();
        dto.setId(idEncuentroCreado);
        dto.setPatientId(refPaciente.getReference().replace("Patient/", ""));
        dto.setStatus("in-progress");
        // dto.set... (los demás campos que uses)
        
        return dto;
    }
}