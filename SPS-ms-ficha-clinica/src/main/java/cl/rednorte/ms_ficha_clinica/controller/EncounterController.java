package cl.rednorte.ms_ficha_clinica.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import cl.rednorte.ms_ficha_clinica.dto.EncounterDTO;
import cl.rednorte.ms_ficha_clinica.service.EncounterService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/encounters")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EncounterController {

    private final EncounterService encounterService;

    @PostMapping
    public ResponseEntity<EncounterDTO> createEncounter(@RequestBody EncounterDTO encounterDTO) {
        return ResponseEntity.ok(encounterService.createEncounter(encounterDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EncounterDTO> getEncounterById(@PathVariable String id) {
        EncounterDTO encounter = encounterService.getEncounterById(id);
        return encounter != null ? ResponseEntity.ok(encounter) : ResponseEntity.notFound().build();
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<EncounterDTO>> getEncountersByPatientId(@PathVariable String patientId) {
        return ResponseEntity.ok(encounterService.getEncountersByPatientId(patientId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<EncounterDTO> updateStatus(@PathVariable String id, @RequestParam String status) {
        EncounterDTO updatedEncounter = encounterService.updateStatus(id, status);
        return updatedEncounter != null ? ResponseEntity.ok(updatedEncounter) : ResponseEntity.badRequest().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEncounter(@PathVariable String id) {
        encounterService.deleteEncounter(id);
        return ResponseEntity.noContent().build();
    }
    // Nuevo endpoint para iniciar la atención desde una cita de la agenda
    @PostMapping("/start/{appointmentId}")
    public ResponseEntity<EncounterDTO> startEncounterFromAppointment(@PathVariable String appointmentId) {
        EncounterDTO nuevoEncuentro = encounterService.startEncounterFromAppointment(appointmentId);
        return ResponseEntity.ok(nuevoEncuentro);
    }

}
