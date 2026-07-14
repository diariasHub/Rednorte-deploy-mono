package com.ms_agenda_profesional.agenda.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentEntity {
    
    @Id
    private String id;
    
    private String patientId;
    private String patientName;
    private String patientRut;
    private String patientAge;
    private String patientPhone;
    private String patientEmail;
    
    private String drId;
    
    private String start;
    private String status;
}
