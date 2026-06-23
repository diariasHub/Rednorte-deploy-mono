package cl.rednorte.ms_ficha_clinica.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConditionDTO {

    private String id;              // <-- ¡Faltaba este campo fundamental!
    private String patientId;
    private String encounterId;
    private String code;
    private String clinicalStatus;
    private String description;
}