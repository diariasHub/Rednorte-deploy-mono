package cl.rednorte.ms_ficha_clinica.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import cl.rednorte.ms_ficha_clinica.dto.ClinicalHistoryDTO;
import cl.rednorte.ms_ficha_clinica.service.ClinicalHistoryService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/history")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ClinicalHistoryController {

    private final ClinicalHistoryService clinicalHistoryService;

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ClinicalHistoryDTO> getFullClinicalHistory(@PathVariable String patientId) {
        return ResponseEntity.ok(clinicalHistoryService.getFullClinicalHistory(patientId));
    }
}
