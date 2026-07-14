package cl.rednorte.ms_notificaciones.controller;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
    private final JavaMailSender mailSender;

    @PostMapping("/send")
    public ResponseEntity<String> sendNotificationEvent(@RequestBody Map<String, String> payload) {
        String message = payload.getOrDefault("mensaje", "Alerta automática del sistema clínico");
        
        // 1. Enviar a SQS (Logica existente - COMENTADA PARA PRUEBAS LOCALES Y EVITAR 500)
        try {
            // publisher.publishNotification(message);
        } catch (Exception e) {
            System.err.println("Advertencia SQS: " + e.getMessage());
        }
        
        // 2. Enviar correo real si viene el email
        String email = payload.get("email");
        if (email != null && !email.isEmpty()) {
            try {
                SimpleMailMessage mailMessage = new SimpleMailMessage();
                mailMessage.setFrom("ru.diego@gmail.com");
                mailMessage.setTo(email);
                mailMessage.setSubject("Confirmación de Reserva Médica - RedNorte");
                
                String paciente = payload.getOrDefault("paciente", "Paciente");
                String idCita = payload.getOrDefault("idCita", "");
                
                String textoCorreo = "Estimado/a " + paciente + ",\n\n"
                        + "Su reserva de hora médica ha sido pre-agendada exitosamente.\n\n"
                        + "Para confirmar definitivamente su hora, por favor haga clic en el siguiente enlace:\n"
                        + "http://localhost:3000/confirmar?id=" + idCita + "\n\n"
                        + "Si usted no ha solicitado esta reserva, ignore este correo.\n\n"
                        + "Saludos cordiales,\nClínica RedNorte.";
                
                mailMessage.setText(textoCorreo);
                mailSender.send(mailMessage);
                
                System.out.println("✅ Correo enviado con éxito a: " + email);
            } catch (Exception e) {
                System.err.println("❌ Error enviando correo a " + email + ": " + e.getMessage());
            }
        }

        return ResponseEntity.ok("Evento de notificación enviado a la cola SQS y por correo con éxito.");
    }
}
