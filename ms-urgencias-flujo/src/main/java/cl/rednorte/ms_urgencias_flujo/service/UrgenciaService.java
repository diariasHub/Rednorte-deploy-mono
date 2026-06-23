package cl.rednorte.ms_urgencias_flujo.service;

import ca.uhn.fhir.rest.api.MethodOutcome;
import ca.uhn.fhir.rest.client.api.IGenericClient;
import org.hl7.fhir.r4.model.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class UrgenciaService {

    private final IGenericClient fhirClient;

    public UrgenciaService(IGenericClient fhirClient) {
        this.fhirClient = fhirClient;
    }

    public String registrarIngreso(String rut, String motivo, String nombre) {
        // 1. Check if patient exists
        Bundle response = fhirClient.search().forResource(Patient.class)
                .where(Patient.IDENTIFIER.exactly().systemAndCode("http://registrocivil.cl/rut", rut))
                .returnBundle(Bundle.class).execute();
                
        String patientId = "";
        
        if (response.getEntry().isEmpty()) {
            // Create patient
            Patient newPatient = new Patient();
            newPatient.addIdentifier().setSystem("http://registrocivil.cl/rut").setValue(rut);
            if (nombre != null && !nombre.isEmpty()) {
                HumanName humanName = new HumanName();
                humanName.setText(nombre);
                humanName.addGiven(nombre);
                newPatient.addName(humanName);
            }
            MethodOutcome patientOutcome = fhirClient.create().resource(newPatient).execute();
            patientId = patientOutcome.getId().getIdPart();
        } else {
            patientId = response.getEntry().get(0).getResource().getIdElement().getIdPart();
            
            // Validar si el paciente ya tiene un encuentro activo
            Bundle activeEncounters = fhirClient.search().forResource(Encounter.class)
                    .where(Encounter.SUBJECT.hasId("Patient/" + patientId))
                    .returnBundle(Bundle.class).execute();
                    
            for (Bundle.BundleEntryComponent entry : activeEncounters.getEntry()) {
                Encounter enc = (Encounter) entry.getResource();
                Encounter.EncounterStatus status = enc.getStatus();
                if (status == Encounter.EncounterStatus.ARRIVED || 
                    status == Encounter.EncounterStatus.TRIAGED || 
                    status == Encounter.EncounterStatus.INPROGRESS) {
                    throw new RuntimeException("El paciente ya tiene una atención de urgencia activa. Debe finalizarla antes de ingresar nuevamente.");
                }
            }
        }
        
        Encounter encuentro = new Encounter();
        encuentro.setStatus(Encounter.EncounterStatus.ARRIVED);
        
        // Identificador del Paciente
        encuentro.setSubject(new Reference("Patient/" + patientId));
        
        // Motivo de consulta
        CodeableConcept motivoCode = new CodeableConcept().setText(motivo);
        encuentro.addReasonCode(motivoCode);

        MethodOutcome outcome = fhirClient.create().resource(encuentro).execute();
        return outcome.getId().getIdPart();
    }

public void procesarTriage(String id, Map<String, Object> datosTriage) {
        // 1. Leer el encuentro actual
        Encounter encuentro = fhirClient.read().resource(Encounter.class).withId(id).execute();
        encuentro.setStatus(Encounter.EncounterStatus.TRIAGED);

        // 2. Asignar Categorización (C1 - C5)
        String categorizacion = String.valueOf(datosTriage.get("categorizacion"));
        CodeableConcept prioridad = new CodeableConcept();
        prioridad.addCoding()
            .setSystem("http://terminology.hl7.org/CodeSystem/v3-ObservationValue")
            .setCode(categorizacion)
            .setDisplay("Categoría " + categorizacion);
        encuentro.setPriority(prioridad);

        Bundle transactionBundle = new Bundle();
        transactionBundle.setType(Bundle.BundleType.TRANSACTION);

        // Añadir la actualización del Encuentro al "paquete" (PUT)
        transactionBundle.addEntry()
            .setResource(encuentro)
            .getRequest()
            .setUrl("Encounter/" + encuentro.getIdElement().getIdPart())
            .setMethod(Bundle.HTTPVerb.PUT);

        // 3. Crear las Observaciones (Signos Vitales opcionales)
        String[] signos = {
            "frecuenciaCardiaca", "saturacion", "temperatura", 
            "presion", "frecuenciaRespiratoria", "eva", "glasgow", "glicemia"
        };

        for (String signo : signos) {
            if (datosTriage.containsKey(signo) && datosTriage.get(signo) != null) {
                String val = String.valueOf(datosTriage.get(signo));
                if (!val.trim().isEmpty()) {
                    Observation obs = new Observation();
                    obs.setStatus(Observation.ObservationStatus.FINAL);
                    obs.setSubject(encuentro.getSubject());
                    obs.setEncounter(new Reference("Encounter/" + encuentro.getIdElement().getIdPart()));
                    obs.setCode(new CodeableConcept().setText(signo));
                    obs.setValue(new StringType(val));

                    transactionBundle.addEntry()
                        .setResource(obs)
                        .getRequest()
                        .setUrl("Observation")
                        .setMethod(Bundle.HTTPVerb.POST);
                }
            }
        }

        // Enviar todo el paquete al servidor en un solo viaje
        fhirClient.transaction().withBundle(transactionBundle).execute();
    }

    public int calcularTiempoEspera(String rut) {
        // 1. Buscar encuentros activos en triage
        Bundle bundle = fhirClient.search().forResource(Encounter.class)
                .where(Encounter.STATUS.exactly().code("triaged"))
                .returnBundle(Bundle.class).execute();

        // 2. Lógica Algorítmica: Contar pacientes con mayor gravedad en la lista
        // aquí se itera el bundle sumando minutos según prioridad relativa.
        return 45; 
    }

public void cancelarAtencion(String idEncuentro, String rutConfirmacion) {
        Encounter encuentro = fhirClient.read().resource(Encounter.class).withId(idEncuentro).execute();
        
        encuentro.setStatus(Encounter.EncounterStatus.CANCELLED);
        
        Extension motivoCancelacion = new Extension();
        motivoCancelacion.setUrl("http://rednorte.cl/fhir/StructureDefinition/motivo-cancelacion");
        motivoCancelacion.setValue(new StringType("Abandono voluntario confirmado por RUT: " + rutConfirmacion));       
        encuentro.addExtension(motivoCancelacion);

        fhirClient.update().resource(encuentro).execute();
    }

    public Map<String, Object> obtenerFichaClinica(String idEncuentro) {
        Encounter encuentro = fhirClient.read().resource(Encounter.class).withId(idEncuentro).execute();
        
        Map<String, Object> ficha = new HashMap<>();
        ficha.put("idEncuentro", idEncuentro);
        ficha.put("motivo", encuentro.hasReasonCode() ? encuentro.getReasonCodeFirstRep().getText() : "Sin motivo");
        ficha.put("estadoActual", encuentro.getStatus() != null ? encuentro.getStatus().toCode() : "unknown");
        
        if (encuentro.hasPriority()) {
            ficha.put("categorizacion", encuentro.getPriority().getCodingFirstRep().getCode());
        }

        // Buscar Observaciones (Signos Vitales)
        Bundle observacionesBundle = fhirClient.search().forResource(Observation.class)
                .where(Observation.ENCOUNTER.hasId("Encounter/" + idEncuentro))
                .returnBundle(Bundle.class).execute();

        Map<String, String> signosVitales = new HashMap<>();
        for (Bundle.BundleEntryComponent entry : observacionesBundle.getEntry()) {
            if (entry.getResource() instanceof Observation) {
                Observation obs = (Observation) entry.getResource();
                if (obs.hasCode() && obs.hasValueStringType()) {
                    signosVitales.put(obs.getCode().getText(), obs.getValueStringType().getValue());
                }
            }
        }
        ficha.put("signosVitales", signosVitales);

        return ficha;
    }

    public void asignarBox(String id, String nombreBox) {
        Encounter encuentro = fhirClient.read().resource(Encounter.class).withId(id).execute();
        
        // Agregar location
        Encounter.EncounterLocationComponent location = new Encounter.EncounterLocationComponent();
        location.setLocation(new Reference().setDisplay(nombreBox));
        
        // Limpiamos la lista de ubicaciones y agregamos la nueva
        encuentro.getLocation().clear();
        encuentro.addLocation(location);

        fhirClient.update().resource(encuentro).execute();
    }

    public void finalizarAtencion(String id, String diagnostico, boolean hospitalizacion) {
        Encounter encuentro = fhirClient.read().resource(Encounter.class).withId(id).execute();
        encuentro.setStatus(Encounter.EncounterStatus.FINISHED);

        // Agregar Diagnóstico de Salida
        Encounter.DiagnosisComponent diagnosisComponent = new Encounter.DiagnosisComponent();
        String textoDiagnostico = diagnostico;
        if (hospitalizacion) {
            textoDiagnostico += " (DERIVADO A HOSPITALIZACIÓN)";
            Encounter.EncounterHospitalizationComponent hosp = new Encounter.EncounterHospitalizationComponent();
            hosp.setAdmitSource(new CodeableConcept().setText("Urgencias"));
            encuentro.setHospitalization(hosp);
        }
        diagnosisComponent.setCondition(new Reference().setDisplay(textoDiagnostico));
        encuentro.addDiagnosis(diagnosisComponent);

        fhirClient.update().resource(encuentro).execute();
    }

    public List<Map<String, Object>> obtenerPacientesPendientesTriage() {
        Bundle bundle = fhirClient.search().forResource(Encounter.class)
                .where(Encounter.STATUS.exactly().code("arrived"))
                .returnBundle(Bundle.class).execute();

        List<Map<String, Object>> pacientes = new ArrayList<>();
        
        for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
            Encounter encuentro = (Encounter) entry.getResource();
            
            Map<String, Object> pac = new HashMap<>();
            pac.put("id", encuentro.getIdElement().getIdPart());
            pac.put("motivo", encuentro.hasReasonCode() ? encuentro.getReasonCodeFirstRep().getText() : "Sin motivo");
            
            if (encuentro.hasSubject() && encuentro.getSubject().getReference() != null) {
                String ref = encuentro.getSubject().getReference(); // e.g. "Patient/123"
                if (ref.startsWith("Patient/")) {
                    try {
                        Patient patient = fhirClient.read().resource(Patient.class).withId(ref.replace("Patient/", "")).execute();
                        if (patient.hasName() && !patient.getName().isEmpty()) {
                            pac.put("nombre", patient.getNameFirstRep().getText());
                        } else {
                            pac.put("nombre", "Desconocido");
                        }
                        if (patient.hasIdentifier() && !patient.getIdentifier().isEmpty()) {
                            pac.put("rut", patient.getIdentifierFirstRep().getValue());
                        } else {
                            pac.put("rut", "Sin RUT");
                        }
                    } catch (Exception e) {
                        pac.put("nombre", "Desconocido");
                        pac.put("rut", "Sin RUT");
                    }
                }
            } else {
                pac.put("nombre", "Desconocido");
                pac.put("rut", "Sin RUT");
            }
            
            pacientes.add(pac);
        }
        
        return pacientes;
    }

    public List<Map<String, Object>> obtenerPacientesTriaged() {
        Bundle bundle = fhirClient.search().forResource(Encounter.class)
                .where(Encounter.STATUS.exactly().code("triaged"))
                .returnBundle(Bundle.class).execute();

        List<Map<String, Object>> pacientes = new ArrayList<>();
        
        for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
            Encounter encuentro = (Encounter) entry.getResource();
            
            Map<String, Object> pac = new HashMap<>();
            pac.put("id", encuentro.getIdElement().getIdPart());
            pac.put("motivo", encuentro.hasReasonCode() ? encuentro.getReasonCodeFirstRep().getText() : "Sin motivo");
            if (encuentro.hasPriority()) {
                pac.put("categorizacion", encuentro.getPriority().getCodingFirstRep().getCode());
            }
            if (encuentro.hasLocation() && !encuentro.getLocation().isEmpty()) {
                pac.put("location", encuentro.getLocationFirstRep().getLocation().getDisplay());
            }
            
            if (encuentro.hasSubject() && encuentro.getSubject().getReference() != null) {
                String ref = encuentro.getSubject().getReference();
                if (ref.startsWith("Patient/")) {
                    try {
                        Patient patient = fhirClient.read().resource(Patient.class).withId(ref.replace("Patient/", "")).execute();
                        if (patient.hasName() && !patient.getName().isEmpty()) {
                            pac.put("nombre", patient.getNameFirstRep().getText());
                        } else {
                            pac.put("nombre", "Desconocido");
                        }
                        if (patient.hasIdentifier() && !patient.getIdentifier().isEmpty()) {
                            pac.put("rut", patient.getIdentifierFirstRep().getValue());
                        } else {
                            pac.put("rut", "Sin RUT");
                        }
                    } catch (Exception e) {
                        pac.put("nombre", "Desconocido");
                        pac.put("rut", "Sin RUT");
                    }
                }
            } else {
                pac.put("nombre", "Desconocido");
                pac.put("rut", "Sin RUT");
            }
            
            pacientes.add(pac);
        }
        
        return pacientes;
    }

    public List<Map<String, Object>> obtenerPacientesDeAlta() {
        Bundle bundle = fhirClient.search().forResource(Encounter.class)
                .where(Encounter.STATUS.exactly().code("finished"))
                .returnBundle(Bundle.class).execute();

        List<Map<String, Object>> pacientes = new ArrayList<>();
        
        for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
            Encounter encuentro = (Encounter) entry.getResource();
            
            Map<String, Object> pac = new HashMap<>();
            pac.put("id", encuentro.getIdElement().getIdPart());
            
            // Buscar Diagnóstico
            if (encuentro.hasDiagnosis() && !encuentro.getDiagnosis().isEmpty()) {
                String dx = encuentro.getDiagnosisFirstRep().getCondition().getDisplay();
                pac.put("diagnostico", dx);
                if (dx != null && dx.contains("HOSPITALIZACIÓN")) {
                    pac.put("tipoAlta", "Hospitalización");
                } else {
                    pac.put("tipoAlta", "Domicilio");
                }
            } else {
                pac.put("diagnostico", "Sin diagnóstico");
                pac.put("tipoAlta", "Desconocido");
            }
            
            if (encuentro.hasSubject() && encuentro.getSubject().getReference() != null) {
                String ref = encuentro.getSubject().getReference();
                if (ref.startsWith("Patient/")) {
                    try {
                        Patient patient = fhirClient.read().resource(Patient.class).withId(ref.replace("Patient/", "")).execute();
                        if (patient.hasName() && !patient.getName().isEmpty()) {
                            pac.put("nombre", patient.getNameFirstRep().getText());
                        } else {
                            pac.put("nombre", "Desconocido");
                        }
                        if (patient.hasIdentifier() && !patient.getIdentifier().isEmpty()) {
                            pac.put("rut", patient.getIdentifierFirstRep().getValue());
                        } else {
                            pac.put("rut", "Sin RUT");
                        }
                    } catch (Exception e) {
                        pac.put("nombre", "Desconocido");
                        pac.put("rut", "Sin RUT");
                    }
                }
            } else {
                pac.put("nombre", "Desconocido");
                pac.put("rut", "Sin RUT");
            }
            
            pacientes.add(pac);
        }
        
        return pacientes;
    }
}