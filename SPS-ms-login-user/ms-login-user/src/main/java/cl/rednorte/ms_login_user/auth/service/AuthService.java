package cl.rednorte.ms_login_user.auth.service;

import cl.rednorte.ms_login_user.auth.config.SecurityProperties;
import cl.rednorte.ms_login_user.auth.dto.*;
import cl.rednorte.ms_login_user.model.User;
import cl.rednorte.ms_login_user.repository.UserRepository;
import cl.rednorte.ms_login_user.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Lógica de autenticación. Activa solo cuando el MS emite tokens propios
 * (perfil dev). En prod la emisión la hace el IdP y este servicio queda
 * deshabilitado por la misma condición que {@link JwtKeyConfig}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.security.jwt.dev-keypair-enabled", havingValue = "true")
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TotpService totpService;
    private final SecurityProperties props;

    @Transactional(noRollbackFor = {
            org.springframework.security.authentication.BadCredentialsException.class,
            org.springframework.security.authentication.LockedException.class,
            org.springframework.security.authentication.DisabledException.class
    })
    public LoginResult login(LoginRequest req) {
        User user = userRepository.findByUsername(req.username())
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));

        if (user.getLockedUntil() != null && Instant.now().isBefore(user.getLockedUntil())) {
            throw new LockedException("Cuenta bloqueada hasta " + user.getLockedUntil());
        }
        if (!user.isActive()) {
            throw new DisabledException("Usuario deshabilitado");
        }
        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            registerFailedAttempt(user);
            throw new BadCredentialsException("Credenciales inválidas");
        }

        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        CustomUserDetails details = CustomUserDetails.from(user);

        if (user.isMfaEnabled()) {
            log.debug("MFA requerido para username={}", user.getUsername());
            return LoginChallengeResponse.required(jwtService.issueMfaChallenge(details));
        }
        return finalizeLogin(user, details);
    }

    @Transactional(noRollbackFor = org.springframework.security.authentication.BadCredentialsException.class)
    public TokenResponse verifyOtp(OtpVerifyRequest req) {
        Jwt jwt = decodeOrFail(req.mfaChallenge(), "MFA_CHALLENGE");
        User user = userRepository.findByUsername(jwt.getSubject())
                .orElseThrow(() -> new BadCredentialsException("Usuario inexistente"));
        if (!user.isMfaEnabled() || user.getMfaSecret() == null) {
            throw new BadCredentialsException("MFA no habilitado para este usuario");
        }
        if (!totpService.verify(user.getMfaSecret(), req.code())) {
            registerFailedAttempt(user);
            throw new BadCredentialsException("Código OTP inválido");
        }
        return finalizeLogin(user, CustomUserDetails.from(user));
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest req) {
        Jwt jwt = decodeOrFail(req.refreshToken(), "REFRESH");
        User user = userRepository.findByUsername(jwt.getSubject())
                .orElseThrow(() -> new BadCredentialsException("Usuario inexistente"));
        if (!user.isActive()) {
            throw new DisabledException("Usuario deshabilitado");
        }
        return issueTokenPair(CustomUserDetails.from(user));
    }

    @Transactional
    public MfaSetupResponse setupMfa(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Usuario inexistente"));
        String secret = totpService.generateSecret();
        user.setMfaSecret(secret);
        user.setMfaEnabled(false);
        userRepository.save(user);
        return new MfaSetupResponse(secret, totpService.generateQrDataUri(secret, username));
    }

    @Transactional
    public void enableMfa(String username, String code) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Usuario inexistente"));
        if (user.getMfaSecret() == null) {
            throw new BadCredentialsException("MFA no inicializado");
        }
        if (!totpService.verify(user.getMfaSecret(), code)) {
            throw new BadCredentialsException("Código OTP inválido");
        }
        user.setMfaEnabled(true);
        userRepository.save(user);
    }

    private TokenResponse finalizeLogin(User user, CustomUserDetails details) {
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        return issueTokenPair(details);
    }

    private TokenResponse issueTokenPair(CustomUserDetails details) {
        String access = jwtService.issueAccessToken(details);
        String refresh = jwtService.issueRefreshToken(details);
        long ttl = props.getJwt().getAccessTokenTtlMinutes() * 60L;
        return TokenResponse.bearer(access, refresh, ttl);
    }

    private Jwt decodeOrFail(String token, String expectedPurpose) {
        Jwt jwt;
        try {
            jwt = jwtService.decode(token);
        } catch (JwtException e) {
            throw new BadCredentialsException("Token inválido");
        }
        if (!expectedPurpose.equals(jwt.getClaimAsString("purpose"))) {
            throw new BadCredentialsException("Token con propósito incorrecto");
        }
        return jwt;
    }

    private void registerFailedAttempt(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        if (attempts >= props.getLockout().getMaxAttempts()) {
            user.setLockedUntil(Instant.now().plus(Duration.ofMinutes(props.getLockout().getLockMinutes())));
            user.setFailedLoginAttempts(0);
            log.warn("Cuenta bloqueada username={} hasta {}", user.getUsername(), user.getLockedUntil());
        } else {
            user.setFailedLoginAttempts(attempts);
        }
        userRepository.save(user);
    }
}
