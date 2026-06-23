package cl.rednorte.ms_login_user.auth.service;

import cl.rednorte.ms_login_user.auth.config.SecurityProperties;
import cl.rednorte.ms_login_user.auth.dto.PatientOtpRequestResponse;
import cl.rednorte.ms_login_user.auth.dto.TokenResponse;
import cl.rednorte.ms_login_user.integration.paciente.PacienteClient;
import cl.rednorte.ms_login_user.integration.paciente.PacientePublicDTO;
import cl.rednorte.ms_login_user.model.PatientOtpChallenge;
import cl.rednorte.ms_login_user.repository.PatientOtpChallengeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Flujo de auto-login del paciente: RUT → OTP → token.
 *
 * Activa solo en dev (emisión propia de JWT). En prod, este flujo lo
 * orquesta el IdP corporativo o se sustituye por su equivalente.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.security.jwt.dev-keypair-enabled", havingValue = "true")
public class PatientAuthService {

    private static final SecureRandom RNG = new SecureRandom();

    private final PatientOtpChallengeRepository challengeRepository;
    private final PacienteClient pacienteClient;
    private final OtpDelivery otpDelivery;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final SecurityProperties props;

    /**
     * Genera y "envía" un OTP. Siempre devuelve OK (no leak de existencia).
     * Si el paciente no existe en ms-paciente, no persiste nada y no llama
     * al delivery — pero el cliente recibe la misma respuesta.
     */
    @Transactional
    public PatientOtpRequestResponse requestOtp(String rut) {
        Optional<PacientePublicDTO> maybe = pacienteClient.findByRut(rut);
        if (maybe.isEmpty()) {
            log.debug("requestOtp: RUT {} no existe en ms-paciente (respuesta genérica al cliente)", rut);
            return PatientOtpRequestResponse.sent();
        }
        PacientePublicDTO p = maybe.get();
        String destination = preferredDestination(p);
        OtpDelivery.Channel channel = (p.phone() != null && !p.phone().isBlank())
                ? OtpDelivery.Channel.SMS : OtpDelivery.Channel.EMAIL;
        if (destination == null) {
            // El paciente existe pero no tiene contacto: no se puede entregar.
            // Mantenemos la respuesta genérica.
            log.warn("requestOtp: paciente {} no tiene phone ni email; no se envía OTP", p.id());
            return PatientOtpRequestResponse.sent();
        }

        // Invalida cualquier challenge activo del mismo RUT.
        challengeRepository.invalidateActiveByRut(rut);

        String otp = generateOtp(props.getPatientOtp().getLength());
        Instant now = Instant.now();
        PatientOtpChallenge challenge = PatientOtpChallenge.builder()
                .rut(rut)
                .patientId(p.id())
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(now.plus(Duration.ofMinutes(props.getPatientOtp().getTtlMinutes())))
                .attempts(0)
                .used(false)
                .createdAt(now)
                .build();
        challengeRepository.save(challenge);

        otpDelivery.send(channel, destination, otp);

        return props.getPatientOtp().isExposeInResponse()
                ? PatientOtpRequestResponse.sentWithDebug(otp)
                : PatientOtpRequestResponse.sent();
    }

    /**
     * Valida el OTP contra el challenge más reciente del RUT. Si OK emite
     * un token corto para el paciente. Errores → BadCredentialsException
     * (el handler de auth lo traduce a 401 OperationOutcome).
     */
    @Transactional(noRollbackFor = BadCredentialsException.class)
    public TokenResponse verifyOtp(String rut, String code) {
        PatientOtpChallenge challenge = challengeRepository
                .findFirstByRutAndUsedFalseOrderByCreatedAtDesc(rut)
                .orElseThrow(() -> new BadCredentialsException("OTP inválido o expirado"));

        if (Instant.now().isAfter(challenge.getExpiresAt())) {
            challenge.setUsed(true);
            challengeRepository.save(challenge);
            throw new BadCredentialsException("OTP inválido o expirado");
        }
        if (challenge.getAttempts() >= props.getPatientOtp().getMaxAttempts()) {
            challenge.setUsed(true);
            challengeRepository.save(challenge);
            throw new BadCredentialsException("OTP inválido o expirado");
        }
        if (!passwordEncoder.matches(code, challenge.getOtpHash())) {
            challenge.setAttempts(challenge.getAttempts() + 1);
            if (challenge.getAttempts() >= props.getPatientOtp().getMaxAttempts()) {
                challenge.setUsed(true);
            }
            challengeRepository.save(challenge);
            throw new BadCredentialsException("OTP inválido o expirado");
        }

        challenge.setUsed(true);
        challengeRepository.save(challenge);

        Duration ttl = Duration.ofMinutes(props.getPatientOtp().getPatientTokenTtlMinutes());
        String accessToken = jwtService.issuePatientAccessToken(challenge.getPatientId(), ttl);
        // Sin refresh para sesiones de paciente — al expirar se pide otro OTP.
        return TokenResponse.bearer(accessToken, null, ttl.toSeconds());
    }

    private static String preferredDestination(PacientePublicDTO p) {
        if (p.phone() != null && !p.phone().isBlank()) return p.phone();
        if (p.email() != null && !p.email().isBlank()) return p.email();
        return null;
    }

    private static String generateOtp(int length) {
        int bound = (int) Math.pow(10, length);
        int n = RNG.nextInt(bound);
        return String.format("%0" + length + "d", n);
    }
}
