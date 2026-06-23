package cl.rednorte.ms_login_user.audit.service;

import cl.rednorte.ms_login_user.audit.event.AuditEvent;
import cl.rednorte.ms_login_user.audit.model.AuditEventType;
import cl.rednorte.ms_login_user.audit.model.AuditLog;
import cl.rednorte.ms_login_user.audit.repository.AuditLogRepository;
import cl.rednorte.ms_login_user.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Persiste el registro de auditoría en la BD del MS y emite un
 * {@link AuditEvent} para listeners (log local hoy, bus externo mañana).
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void recordResourceAccess(AuditEventType type,
                                     String resourceType,
                                     String resourceId,
                                     boolean breakGlass,
                                     String reason,
                                     HttpServletRequest request) {
        Principal p = currentPrincipal();
        AuditLog log = AuditLog.builder()
                .eventType(type)
                .username(p.username)
                .userId(p.userId)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .ipAddress(clientIp(request))
                .userAgent(truncate(request.getHeader("User-Agent"), 200))
                .endpoint(request.getMethod() + " " + request.getRequestURI())
                .jti(MDC.get("jti"))
                .breakGlass(breakGlass)
                .reason(reason)
                .occurredAt(Instant.now())
                .build();
        auditLogRepository.save(log);
        eventPublisher.publishEvent(new AuditEvent(
                log.getEventType(), log.getUsername(), log.getUserId(),
                log.getResourceType(), log.getResourceId(),
                log.getIpAddress(), log.getUserAgent(), log.getEndpoint(),
                log.getJti(), log.isBreakGlass(), log.getReason(), log.getOccurredAt()));
    }

    @Transactional
    public void recordAuthEvent(AuditEventType type, String username, Long userId,
                                String reason, HttpServletRequest request) {
        AuditLog log = AuditLog.builder()
                .eventType(type)
                .username(username)
                .userId(userId)
                .ipAddress(clientIp(request))
                .userAgent(truncate(request.getHeader("User-Agent"), 200))
                .endpoint(request.getMethod() + " " + request.getRequestURI())
                .jti(MDC.get("jti"))
                .reason(reason)
                .occurredAt(Instant.now())
                .build();
        auditLogRepository.save(log);
        eventPublisher.publishEvent(new AuditEvent(
                log.getEventType(), log.getUsername(), log.getUserId(),
                null, null,
                log.getIpAddress(), log.getUserAgent(), log.getEndpoint(),
                log.getJti(), false, log.getReason(), log.getOccurredAt()));
    }

    private record Principal(String username, Long userId) {}

    private Principal currentPrincipal() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails u) {
            return new Principal(u.getUsername(), u.getUserId());
        }
        return new Principal(null, null);
    }

    private String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
