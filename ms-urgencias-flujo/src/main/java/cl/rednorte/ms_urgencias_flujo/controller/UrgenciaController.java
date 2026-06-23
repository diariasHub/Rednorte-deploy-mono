package cl.rednorte.ms_urgencias_flujo.controller;


import cl.rednorte.ms_urgencias_flujo.service.UrgenciaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/urgencias")
public class UrgenciaController {

    private final UrgenciaService urgenciaService;

    public UrgenciaController(UrgenciaService urgenciaService) {
        this.urgenciaService = urgenciaService;
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("ok");
    }

    @PostMapping("/ingreso")
    public ResponseEntity<?> ingresoRecepcion(@RequestBody Map<String, String> payload) {
        try {
            String id = urgenciaService.registrarIngreso(payload.get("rut"), payload.get("motivo"), payload.get("nombre"));
            return ResponseEntity.ok("Paciente ingresado. ID Encuentro: " + id);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/pendientes")
    public ResponseEntity<java.util.List<Map<String, Object>>> obtenerPendientes() {
        return ResponseEntity.ok(urgenciaService.obtenerPacientesPendientesTriage());
    }

    @GetMapping("/triaged")
    public ResponseEntity<java.util.List<Map<String, Object>>> obtenerTriaged() {
        return ResponseEntity.ok(urgenciaService.obtenerPacientesTriaged());
    }

    @GetMapping("/altas")
    public ResponseEntity<java.util.List<Map<String, Object>>> obtenerAltas() {
        return ResponseEntity.ok(urgenciaService.obtenerPacientesDeAlta());
    }

    @PutMapping("/triage/{id}")
    public ResponseEntity<String> realizarTriage(@PathVariable String id, @RequestBody Map<String, Object> datosTriage) {
        urgenciaService.procesarTriage(id, datosTriage);
        return ResponseEntity.ok("Triage completado con éxito.");
    }

    @GetMapping("/espera/{rut}")
    public ResponseEntity<Map<String, Object>> consultarEspera(@PathVariable String rut) {
        int minutos = urgenciaService.calcularTiempoEspera(rut);
        return ResponseEntity.ok(Map.of("rut", rut, "tiempoEsperaMinutos", minutos));
    }

    @PutMapping("/rechazo")
    public ResponseEntity<String> rechazarAtencion(@RequestBody Map<String, String> payload) {
        urgenciaService.cancelarAtencion(payload.get("idEncuentro"), payload.get("rutConfirmacion"));
        return ResponseEntity.ok("Atención rechazada por el usuario de forma conforme.");
    }

    @PutMapping("/box/{id}")
    public ResponseEntity<String> asignarBox(@PathVariable String id, @RequestBody Map<String, String> payload) {
        urgenciaService.asignarBox(id, payload.get("box"));
        return ResponseEntity.ok("Box asignado correctamente.");
    }

    @GetMapping("/ficha/{id}")
    public ResponseEntity<Map<String, Object>> verFichaMedica(@PathVariable String id) {
        Map<String, Object> ficha = urgenciaService.obtenerFichaClinica(id);
        return ResponseEntity.ok(ficha);
    }

    @PutMapping("/alta/{id}")
    public ResponseEntity<String> darAltaMedica(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        boolean hospitalizar = false;
        if (payload.containsKey("hospitalizacion")) {
            hospitalizar = Boolean.parseBoolean(payload.get("hospitalizacion").toString());
        }
        urgenciaService.finalizarAtencion(id, (String) payload.get("diagnostico"), hospitalizar);
        return ResponseEntity.ok("Alta médica procesada correctamente.");
    }
}