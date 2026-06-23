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

import cl.rednorte.ms_ficha_clinica.dto.ConditionDTO;
import cl.rednorte.ms_ficha_clinica.service.ConditionService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/conditions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConditionController {

    private final ConditionService conditionService;

    @PostMapping
    public ResponseEntity<ConditionDTO> createCondition(@RequestBody ConditionDTO conditionDTO) {
        return ResponseEntity.ok(conditionService.createCondition(conditionDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConditionDTO> getConditionById(@PathVariable String id) {
        ConditionDTO condition = conditionService.getConditionById(id);
        return condition != null ? ResponseEntity.ok(condition) : ResponseEntity.notFound().build();
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ConditionDTO>> getConditionsByPatientId(@PathVariable String patientId) {
        return ResponseEntity.ok(conditionService.getConditionsByPatientId(patientId));
    }

    @GetMapping("/encounter/{encounterId}")
    public ResponseEntity<List<ConditionDTO>> getConditionsByEncounterId(@PathVariable String encounterId) {
        return ResponseEntity.ok(conditionService.getConditionsByEncounterId(encounterId));
    }

    @GetMapping("/patient/{patientId}/history")
    public ResponseEntity<List<ConditionDTO>> getConditionHistory(@PathVariable String patientId) {
        return ResponseEntity.ok(conditionService.getConditionHistory(patientId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCondition(@PathVariable String id) {
        conditionService.deleteCondition(id);
        return ResponseEntity.noContent().build();
    }
}
