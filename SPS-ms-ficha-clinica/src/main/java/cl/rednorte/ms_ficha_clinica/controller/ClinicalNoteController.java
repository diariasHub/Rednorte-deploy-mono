package cl.rednorte.ms_ficha_clinica.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import cl.rednorte.ms_ficha_clinica.dto.ClinicalNoteDTO;
import cl.rednorte.ms_ficha_clinica.service.ClinicalNoteService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/clinical-notes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ClinicalNoteController {

    private final ClinicalNoteService clinicalNoteService;

    @PostMapping
    public ResponseEntity<ClinicalNoteDTO> createClinicalNote(@RequestBody ClinicalNoteDTO clinicalNoteDTO) {
        return ResponseEntity.ok(clinicalNoteService.createClinicalNote(clinicalNoteDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClinicalNoteDTO> getClinicalNoteById(@PathVariable String id) {
        ClinicalNoteDTO clinicalNote = clinicalNoteService.getClinicalNoteById(id);
        return clinicalNote != null ? ResponseEntity.ok(clinicalNote) : ResponseEntity.notFound().build();
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ClinicalNoteDTO>> getClinicalNotesByPatientId(@PathVariable String patientId) {
        return ResponseEntity.ok(clinicalNoteService.getClinicalNotesByPatientId(patientId));
    }

    @GetMapping("/encounter/{encounterId}")
    public ResponseEntity<List<ClinicalNoteDTO>> getClinicalNotesByEncounterId(@PathVariable String encounterId) {
        return ResponseEntity.ok(clinicalNoteService.getClinicalNotesByEncounterId(encounterId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClinicalNote(@PathVariable String id) {
        clinicalNoteService.deleteClinicalNote(id);
        return ResponseEntity.noContent().build();
    }
}
