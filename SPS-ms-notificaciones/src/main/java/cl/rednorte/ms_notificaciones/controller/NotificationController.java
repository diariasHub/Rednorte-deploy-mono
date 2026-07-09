package cl.rednorte.ms_notificaciones.controller;

import cl.rednorte.ms_notificaciones.service.SqsNotificationPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notificaciones")
@RequiredArgsConstructor
public class NotificationController {

    private final SqsNotificationPublisher publisher;

    @PostMapping("/send")
    public ResponseEntity<String> sendNotificationEvent(@RequestBody Map<String, String> payload) {
        String message = payload.getOrDefault("mensaje", "Alerta automática del sistema clínico");
        publisher.publishNotification(message);
        return ResponseEntity.ok("Evento de notificación enviado a la cola SQS con éxito.");
    }
}
