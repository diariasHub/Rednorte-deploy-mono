package cl.rednorte.ms_login_user.audit.event;

import cl.rednorte.ms_login_user.audit.model.AuditEventType;

import java.time.Instant;

/**
 * Evento de auditoría que el {@code AuditEventListener} consume (log local
 * y, en iteración 2, publicación a un bus externo tipo Kafka).
 */
public record AuditEvent(
        AuditEventType eventType,
        String username,
        Long userId,
        String resourceType,
        String resourceId,
        String ipAddress,
        String userAgent,
        String endpoint,
        String jti,
        boolean breakGlass,
        String reason,
        Instant occurredAt
) {}
