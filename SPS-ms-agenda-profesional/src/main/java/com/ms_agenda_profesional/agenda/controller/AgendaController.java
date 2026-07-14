package com.ms_agenda_profesional.agenda.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.hl7.fhir.r4.model.Appointment;
import org.hl7.fhir.r4.model.Appointment.AppointmentStatus;
import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.Reference;
import org.hl7.fhir.r4.model.Schedule;
import org.hl7.fhir.r4.model.Slot;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ms_agenda_profesional.dto.AppointmentDTO;
import com.ms_agenda_profesional.dto.ConfirmacionReservaResponse;
import com.ms_agenda_profesional.agenda.model.AppointmentEntity;
import com.ms_agenda_profesional.agenda.service.AppointmentService;

import ca.uhn.fhir.parser.IParser;
import ca.uhn.fhir.rest.api.MethodOutcome;
import ca.uhn.fhir.rest.client.api.IGenericClient;

@RestController
@RequestMapping("/agendas")
public class AgendaController {

    private final IGenericClient fhirClient;
    private final AppointmentService appointmentService;

    public AgendaController(IGenericClient fhirClient, AppointmentService appointmentService) {
        this.fhirClient = fhirClient;
        this.appointmentService = appointmentService;
    }

    // 1. Crear una Agenda (Schedule) para un Médico
    @PostMapping
    public ResponseEntity<String> crearAgenda(@RequestParam String idMedico, 
                                              @RequestParam String nombreMedico) {
        
        Schedule agenda = new Schedule();
        agenda.setActive(true);
        
        Reference actorRef = new Reference("Practitioner/" + idMedico);
        actorRef.setDisplay("Dr. " + nombreMedico);
        agenda.addActor(actorRef);

        MethodOutcome resultado = fhirClient.create()
                .resource(agenda)
                .execute();

        String idAgendaCreada = resultado.getId().getIdPart();

        return ResponseEntity.ok("Agenda creada con ID: " + idAgendaCreada);
    }

    // 2. Agregar un bloque de tiempo (Slot) a una Agenda específica
    @PostMapping("/{idAgenda}/bloques")
    public ResponseEntity<String> crearBloque(@PathVariable String idAgenda) {
        
        Slot bloque = new Slot();
        bloque.setSchedule(new Reference("Schedule/" + idAgenda));
        bloque.setStatus(Slot.SlotStatus.FREE);

        Date fechaInicio = new Date(); 
        Date fechaFin = new Date(fechaInicio.getTime() + (30 * 60 * 1000)); 
        
        bloque.setStart(fechaInicio);
        bloque.setEnd(fechaFin);

        MethodOutcome resultado = fhirClient.create()
                .resource(bloque)
                .execute();

        return ResponseEntity.ok("Bloque de tiempo creado con ID: " + resultado.getId().getIdPart());
    }

    // 2.5 Generar múltiples bloques de 15 minutos en un rango
    @PostMapping("/{drId}/generar-bloques")
    public ResponseEntity<List<String>> generarBloques(
            @PathVariable String drId, 
            @RequestBody java.util.Map<String, String> body) {
        
        String fechaStr = body.get("fecha"); // "2026-07-16"
        String horaInicio = body.get("horaInicio"); // "09:00"
        String horaFin = body.get("horaFin"); // "13:00"
        String drName = body.getOrDefault("nombreMedico", "Médico");

        if (fechaStr == null || horaInicio == null || horaFin == null) {
            return ResponseEntity.badRequest().build();
        }

        try {
            // 1. Buscar si existe una agenda para el médico
            Bundle response = fhirClient.search()
                    .forResource(Schedule.class)
                    .where(Schedule.ACTOR.hasId("Practitioner/" + drId))
                    .returnBundle(Bundle.class)
                    .execute();

            String idAgenda;
            if (response.hasEntry()) {
                idAgenda = response.getEntry().get(0).getResource().getIdElement().getIdPart();
            } else {
                // Crear la agenda si no existe
                Schedule agenda = new Schedule();
                agenda.setActive(true);
                Reference actorRef = new Reference("Practitioner/" + drId);
                actorRef.setDisplay("Dr. " + drName);
                agenda.addActor(actorRef);

                MethodOutcome resultado = fhirClient.create().resource(agenda).execute();
                idAgenda = resultado.getId().getIdPart();
            }

            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm");
            Date inicio = sdf.parse(fechaStr + " " + horaInicio);
            Date fin = sdf.parse(fechaStr + " " + horaFin);

            List<String> creados = new ArrayList<>();
            long curTime = inicio.getTime();

            while (curTime + (15 * 60 * 1000) <= fin.getTime()) {
                Date slotStart = new Date(curTime);
                Date slotEnd = new Date(curTime + (15 * 60 * 1000));

                Slot bloque = new Slot();
                bloque.setSchedule(new Reference("Schedule/" + idAgenda));
                bloque.setStatus(Slot.SlotStatus.FREE);
                bloque.setStart(slotStart);
                bloque.setEnd(slotEnd);

                MethodOutcome outcome = fhirClient.create().resource(bloque).execute();
                creados.add(outcome.getId().getIdPart());

                curTime += (15 * 60 * 1000);
            }

            return ResponseEntity.ok(creados);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // 3. Consultar los bloques LIBRES de una agenda
    @GetMapping("/{idAgenda}/bloques-libres")
    public ResponseEntity<List<String>> listarBloquesLibres(@PathVariable String idAgenda) {
        
        Bundle response = fhirClient.search()
                .forResource(Slot.class)
                .where(Slot.SCHEDULE.hasId(idAgenda))
                .and(Slot.STATUS.exactly().code(Slot.SlotStatus.FREE.toCode()))
                .returnBundle(Bundle.class)
                .execute();

        List<String> bloques = new ArrayList<>();

        response.getEntry().forEach(entry -> {
            Slot slot = (Slot) entry.getResource();
            String infoBloque = "ID Slot: " + slot.getIdElement().getIdPart() + 
                                " | Inicio: " + slot.getStart() + 
                                " | Fin: " + slot.getEnd();
            bloques.add(infoBloque);
        });

        return ResponseEntity.ok(bloques);
    }


    // 5. Consultar las citas de un médico específico (AHORA CON CQRS Y CACHÉ)
    @GetMapping("/appointments/doctor/{drId}")
    public ResponseEntity<List<AppointmentDTO>> listarCitasMedico(
            @PathVariable String drId, 
            @RequestParam(required = false) String date) {
        
        // Si hay datos en la BD local (Caché/Postgres), usar eso!
        if (appointmentService.hasDataForDoctor(drId)) {
            List<AppointmentDTO> citas = appointmentService.getAppointmentsByDoctor(drId);
            if (date != null && !date.isEmpty()) {
                citas = citas.stream().filter(c -> c.start().startsWith(date)).toList();
            }
            return ResponseEntity.ok(citas);
        }

        // Si no hay, hidratamos desde FHIR (Fallback inicial)
        Bundle response = fhirClient.search()
                .forResource(Appointment.class)
                .where(Appointment.ACTOR.hasId("Practitioner/" + drId))
                .include(Appointment.INCLUDE_PATIENT) 
                .returnBundle(Bundle.class)
                .execute();

        List<AppointmentDTO> citas = new ArrayList<>();
        List<AppointmentEntity> entidades = new ArrayList<>();

        if (response.hasEntry()) {
            response.getEntry().forEach(entry -> {
                if (!(entry.getResource() instanceof Appointment)) return;
                Appointment appt = (Appointment) entry.getResource();
                String fechaInicio = appt.getStart() != null ? appt.getStart().toInstant().toString() : "";

                String patientId = "";
                String patientName = "Sin Nombre";
                String patientRut = "N/A";
                String patientAge = "--";
                String patientPhone = "";
                String patientEmail = "";

                for (Appointment.AppointmentParticipantComponent p : appt.getParticipant()) {
                    if (p.getActor().getReference() != null && p.getActor().getReference().contains("Patient")) {
                        String idLimpio = p.getActor().getReference().replace("Patient/", "");
                        patientId = idLimpio;
                        final String finalPatientId = idLimpio; 
                        
                        org.hl7.fhir.r4.model.Patient pResource = (org.hl7.fhir.r4.model.Patient) response.getEntry().stream()
                            .map(Bundle.BundleEntryComponent::getResource)
                            .filter(r -> r instanceof org.hl7.fhir.r4.model.Patient && 
                                        r.getIdElement().getIdPart().equals(finalPatientId))
                            .findFirst().orElse(null);
                                       
                        if (pResource != null) {
                            patientName = pResource.hasName() ? pResource.getNameFirstRep().getNameAsSingleString() : "Sin Nombre";
                            patientRut = pResource.hasIdentifier() ? pResource.getIdentifierFirstRep().getValue() : "N/A";

                            if (pResource.hasBirthDate()) {
                                java.time.LocalDate birthDate = pResource.getBirthDate().toInstant()
                                        .atZone(java.time.ZoneId.systemDefault()).toLocalDate();
                                int age = java.time.Period.between(birthDate, java.time.LocalDate.now()).getYears();
                                patientAge = String.valueOf(age);
                            }
                            
                            if (pResource.hasTelecom()) {
                                for (org.hl7.fhir.r4.model.ContactPoint cp : pResource.getTelecom()) {
                                    if (cp.getSystem() == org.hl7.fhir.r4.model.ContactPoint.ContactPointSystem.PHONE) {
                                        patientPhone = cp.getValue();
                                    } else if (cp.getSystem() == org.hl7.fhir.r4.model.ContactPoint.ContactPointSystem.EMAIL) {
                                        patientEmail = cp.getValue();
                                    }
                                }
                            }
                        }
                    }
                }

                String estado = appt.getStatus() != null ? appt.getStatus().toCode() : "pending";

                AppointmentDTO dto = new AppointmentDTO(
                    appt.getIdElement().getIdPart(), patientId, patientName, patientRut, fechaInicio, estado, patientAge, patientPhone, patientEmail
                );
                citas.add(dto);

                entidades.add(new AppointmentEntity(
                    dto.id(), dto.patientId(), dto.patientName(), dto.patientRut(), dto.patientAge(), patientPhone, patientEmail, drId, dto.start(), dto.status()
                ));
            });
        }

        appointmentService.saveAll(entidades); // Guardar en BD para futuras consultas
        
        if (date != null && !date.isEmpty()) {
            return ResponseEntity.ok(citas.stream().filter(c -> c.start().startsWith(date)).toList());
        }
        return ResponseEntity.ok(citas);
    }

    // 5.1 Obtener TODAS las citas (para Administrador)
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentDTO>> listarTodasCitas() {
        if (appointmentService.hasAnyData()) {
            return ResponseEntity.ok(appointmentService.getAllAppointments());
        }
        return ResponseEntity.ok(new ArrayList<>());
    }

    // 5.2 Crear cita proxy
    @PostMapping("/appointments/fhir")
    public ResponseEntity<String> createCitaBypass(@RequestBody String fhirJson) {
        IParser parser = fhirClient.getFhirContext().newJsonParser();
        Appointment cita = parser.parseResource(Appointment.class, fhirJson);

        MethodOutcome outcome = fhirClient.create().resource(cita).execute();
        Appointment savedCita = (Appointment) outcome.getResource();
        if (savedCita == null) {
            savedCita = fhirClient.read().resource(Appointment.class).withId(outcome.getId()).execute();
        }

        // Parse to entity
        String pId = "", pName = "Paciente Desconocido", pRut = "", pAge = "--", docId = "";
        String pPhone = "", pEmail = "";
        for (Appointment.AppointmentParticipantComponent p : savedCita.getParticipant()) {
            if (p.getActor().getReference() != null) {
                if (p.getActor().getReference().contains("Patient")) {
                    pId = p.getActor().getReference().replace("Patient/", "");
                    pName = p.getActor().getDisplay() != null ? p.getActor().getDisplay() : pName;
                    
                    try {
                        org.hl7.fhir.r4.model.Patient pat = fhirClient.read().resource(org.hl7.fhir.r4.model.Patient.class).withId(pId).execute();
                        if (pat.hasIdentifier()) {
                            pRut = pat.getIdentifierFirstRep().getValue();
                        }
                        if (pat.hasTelecom()) {
                            for (org.hl7.fhir.r4.model.ContactPoint cp : pat.getTelecom()) {
                                if (cp.getSystem() == org.hl7.fhir.r4.model.ContactPoint.ContactPointSystem.PHONE) {
                                    pPhone = cp.getValue();
                                } else if (cp.getSystem() == org.hl7.fhir.r4.model.ContactPoint.ContactPointSystem.EMAIL) {
                                    pEmail = cp.getValue();
                                }
                            }
                        }
                    } catch (Exception e) {}
                }
                if (p.getActor().getReference().contains("Practitioner")) {
                    docId = p.getActor().getReference().replace("Practitioner/", "");
                }
            }
        }
        String estado = savedCita.getStatus() != null ? savedCita.getStatus().toCode() : "proposed";
        String start = savedCita.getStart() != null ? savedCita.getStart().toInstant().toString() : "";
        
        AppointmentEntity entity = new AppointmentEntity(
            savedCita.getIdElement().getIdPart(), pId, pName, pRut, pAge, pPhone, pEmail, docId, start, estado
        );
        appointmentService.saveAppointment(entity);

        return ResponseEntity.ok(parser.encodeResourceToString(savedCita));
    }

    // 5.3 Actualizar tiempo de cita proxy
    @PatchMapping("/appointments/{idAppointment}/time")
    public ResponseEntity<String> actualizarTiempoCita(
            @PathVariable String idAppointment, 
            @RequestBody java.util.Map<String, String> body) {
        
        Appointment cita = fhirClient.read().resource(Appointment.class).withId(idAppointment).execute();
        if (body.containsKey("start")) {
            cita.setStart(java.util.Date.from(java.time.Instant.parse(body.get("start"))));
        }
        if (body.containsKey("end")) {
            cita.setEnd(java.util.Date.from(java.time.Instant.parse(body.get("end"))));
        }
        fhirClient.update().resource(cita).execute();
        
        String start = cita.getStart() != null ? cita.getStart().toInstant().toString() : "";
        appointmentService.updateTime(idAppointment, start);

        return ResponseEntity.ok("Tiempo actualizado");
    }


    // 6. Cambiar el estado de la cita (Ej: booked -> arrived)
    @PatchMapping("/appointments/{idAppointment}/status")
    public ResponseEntity<String> cambiarEstadoCita(
            @PathVariable String idAppointment, 
            @RequestBody java.util.Map<String, String> body) {
        
        String nuevoEstadoStr = body.get("status");
        if (nuevoEstadoStr == null) {
            return ResponseEntity.badRequest().body("El campo 'status' es requerido.");
        }

        Appointment cita = fhirClient.read()
                .resource(Appointment.class)
                .withId(idAppointment)
                .execute();

        cita.setStatus(AppointmentStatus.fromCode(nuevoEstadoStr));

        fhirClient.update()
                .resource(cita)
                .execute();

        appointmentService.updateStatus(idAppointment, nuevoEstadoStr);

        return ResponseEntity.ok("Estado actualizado correctamente a: " + nuevoEstadoStr);
    }

    // 4. Reservar un turno (Crear Appointment y actualizar el Slot a BUSY)
    @PostMapping("/bloques/{idSlot}/reservar")
    public ResponseEntity<Object> reservarTurno(@PathVariable String idSlot,
                                                @RequestParam String idPaciente,
                                                @RequestParam String nombrePaciente,
                                                @RequestParam String idMedico) {
        
        Slot slot = fhirClient.read()
                .resource(Slot.class)
                .withId(idSlot)
                .execute();

        if (slot.getStatus() != Slot.SlotStatus.FREE) {
            return ResponseEntity.badRequest().body("El bloque de tiempo ya no está disponible.");
        }

        Appointment cita = new Appointment();
        cita.setStatus(AppointmentStatus.BOOKED);
        cita.setStart(slot.getStart());
        cita.setEnd(slot.getEnd());
        
        cita.addSlot(new Reference("Slot/" + idSlot));

        Appointment.AppointmentParticipantComponent participantePaciente = new Appointment.AppointmentParticipantComponent();
        participantePaciente.setActor(new Reference("Patient/" + idPaciente).setDisplay(nombrePaciente));
        participantePaciente.setStatus(Appointment.ParticipationStatus.ACCEPTED);
        cita.addParticipant(participantePaciente);

        Appointment.AppointmentParticipantComponent participanteMedico = new Appointment.AppointmentParticipantComponent();
        participanteMedico.setActor(new Reference("Practitioner/" + idMedico));
        participanteMedico.setStatus(Appointment.ParticipationStatus.ACCEPTED);
        cita.addParticipant(participanteMedico);

        MethodOutcome resultadoCita = fhirClient.create()
                .resource(cita)
                .execute();

        String idCitaCreada = resultadoCita.getId().getIdPart();

        slot.setStatus(Slot.SlotStatus.BUSY);
        try {
            fhirClient.update()
                    .resource(slot)
                    .withAdditionalHeader("If-Match", slot.getIdElement().getVersionIdPart())
                    .execute();
        } catch (ca.uhn.fhir.rest.server.exceptions.PreconditionFailedException e) {
            return ResponseEntity.status(409).body("Error: El bloque de tiempo fue reservado por otro usuario de manera simultánea.");
        }

        ConfirmacionReservaResponse respuesta = new ConfirmacionReservaResponse(
            "Reserva confirmada con éxito.",
            idCitaCreada,
            idSlot,
            "BOOKED"
        );

        return ResponseEntity.ok(respuesta);
    }
}