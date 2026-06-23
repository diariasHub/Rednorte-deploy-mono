package cl.rednorte.ms_login_user.auth.service;

import cl.rednorte.ms_login_user.auth.config.SecurityProperties;
import cl.rednorte.ms_login_user.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.security.jwt.dev-keypair-enabled", havingValue = "true")
public class JwtService {

    public enum TokenPurpose { ACCESS, REFRESH, MFA_CHALLENGE }

    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    private final SecurityProperties props;

    public String issueAccessToken(CustomUserDetails user) {
        Duration ttl = Duration.ofMinutes(props.getJwt().getAccessTokenTtlMinutes());
        return issue(user, TokenPurpose.ACCESS, ttl, authorities(user));
    }

    public String issueRefreshToken(CustomUserDetails user) {
        Duration ttl = Duration.ofHours(props.getJwt().getRefreshTokenTtlHours());
        return issue(user, TokenPurpose.REFRESH, ttl, List.of());
    }

    /** Token de corta vida emitido tras el login OK, antes de validar OTP. */
    public String issueMfaChallenge(CustomUserDetails user) {
        return issue(user, TokenPurpose.MFA_CHALLENGE, Duration.ofMinutes(5), List.of());
    }

    /**
     * Token para el paciente que se auto-autentica con RUT + OTP. Acotado:
     * {@code sub=patientId}, claim {@code patient_id=patientId}, una sola
     * authority ROLE_PATIENT. Sin refresh (al expirar se pide otro OTP).
     */
    public String issuePatientAccessToken(String patientId, Duration ttl) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.getJwt().getIssuer())
                .issuedAt(now)
                .expiresAt(now.plus(ttl))
                .subject(patientId)
                .id(UUID.randomUUID().toString())
                .claim("patient_id", patientId)
                .claim("purpose", TokenPurpose.ACCESS.name())
                .claim("roles", List.of("ROLE_PATIENT"))
                .build();
        JwsHeader header = JwsHeader.with(() -> "RS256").build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public Jwt decode(String token) {
        return decoder.decode(token);
    }

    /**
     * Token de cuenta de servicio (machine-to-machine). El sujeto es el
     * nombre de la cuenta; no requiere un usuario en BD. Para llamar
     * endpoints /internal/** de otros MS desde dentro del ecosistema.
     */
    public String issueServiceToken(String subject, java.util.List<String> roles, Duration ttl) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.getJwt().getIssuer())
                .issuedAt(now)
                .expiresAt(now.plus(ttl))
                .subject(subject)
                .id(UUID.randomUUID().toString())
                .claim("purpose", TokenPurpose.ACCESS.name())
                .claim("roles", roles)
                .build();
        JwsHeader header = JwsHeader.with(() -> "RS256").build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private String issue(CustomUserDetails user, TokenPurpose purpose, Duration ttl, List<String> roles) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.getJwt().getIssuer())
                .issuedAt(now)
                .expiresAt(now.plus(ttl))
                .subject(user.getUsername())
                .id(UUID.randomUUID().toString())
                .claim("uid", user.getUserId())
                .claim("purpose", purpose.name())
                .claim("roles", roles)
                .build();
        JwsHeader header = JwsHeader.with(() -> "RS256").build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private List<String> authorities(CustomUserDetails user) {
        return user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
    }
}
