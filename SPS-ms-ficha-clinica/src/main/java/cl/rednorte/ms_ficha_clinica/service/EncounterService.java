package cl.rednorte.ms_ficha_clinica.service;

import java.util.List;

import cl.rednorte.ms_ficha_clinica.dto.EncounterDTO;

public interface EncounterService {
    EncounterDTO createEncounter(EncounterDTO encounterDTO);

    EncounterDTO getEncounterById(String id);

    List<EncounterDTO> getEncountersByPatientId(String patientId);

    EncounterDTO updateStatus(String id, String status);

    void deleteEncounter(String id);

    EncounterDTO startEncounterFromAppointment(String appointmentId);
}
