package cl.rednorte.ms_login_user.audit.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Registro inmutable de auditoría. No exponer ni para update/delete:
 * los datos clínicos son no-repudiables.
 */
@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_username", columnList = "username"),
        @Index(name = "idx_audit_resource", columnList = "resourceType,resourceId"),
        @Index(name = "idx_audit_occurred", columnList = "occurredAt")
})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AuditEventType eventType;

    @Column(length = 60)
    private String username;

    private Long userId;

    @Column(length = 32)
    private String resourceType;

    @Column(length = 64)
    private String resourceId;

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 200)
    private String userAgent;

    @Column(length = 200)
    private String endpoint;

    @Column(length = 36)
    private String jti;

    @Column(nullable = false)
    @Builder.Default
    private boolean breakGlass = false;

    @Column(length = 500)
    private String reason;

    @Column(nullable = false)
    private Instant occurredAt;
}
