package cl.rednorte.ms_login_user.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Desafío OTP emitido a un paciente que se está autenticando. El OTP nunca
 * se guarda en claro: solo su BCrypt hash. Caduca a los pocos minutos
 * (TTL configurable) y soporta un máximo de intentos antes de invalidarse.
 */
@Entity
@Table(name = "patient_otp_challenge", indexes = {
        @Index(name = "idx_patient_otp_rut", columnList = "rut"),
        @Index(name = "idx_patient_otp_created", columnList = "createdAt")
})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PatientOtpChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** RUT que solicitó el OTP. Permitido formato chileno con guión. */
    @Column(nullable = false, length = 20)
    private String rut;

    /** Logical ID del paciente en ms-paciente, capturado al emitir el OTP. */
    @Column(name = "patient_id", nullable = false, length = 64)
    private String patientId;

    /** BCrypt hash del OTP en claro (que se envía al paciente). */
    @Column(name = "otp_hash", nullable = false, length = 100)
    private String otpHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean used = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
