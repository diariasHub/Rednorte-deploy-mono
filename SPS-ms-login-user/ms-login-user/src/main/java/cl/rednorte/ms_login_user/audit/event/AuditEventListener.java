package cl.rednorte.ms_login_user.audit.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listener inicial: solo loguea. En iteración 2 se reemplaza por publicación
 * a Kafka/RabbitMQ. Cuidado de NO loguear el cuerpo del recurso ni el token —
 * solo los metadatos de acceso.
 */
@Slf4j
@Component
public class AuditEventListener {

    @Async
    @EventListener
    public void onAuditEvent(AuditEvent event) {
        log.info("AUDIT type={} user={} uid={} resource={}/{} ip={} endpoint={} breakGlass={} reason={}",
                event.eventType(), event.username(), event.userId(),
                event.resourceType(), event.resourceId(),
                event.ipAddress(), event.endpoint(),
                event.breakGlass(), event.reason());
    }
}
