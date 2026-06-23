package cl.rednorte.ms_ficha_clinica.dto;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncounterDTO {
    private String id;
    private String patientId;
    private String locationId;
    private String status;
    private Date periodStart;
    private Date periodEnd;
    private String practitioner;
}
