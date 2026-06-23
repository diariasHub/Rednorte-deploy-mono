package cl.rednorte.ms_login_user.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Extrae el JWT del header {@code Authorization: Bearer ...}, lo valida,
 * exige {@code purpose=ACCESS} y deja el {@link CustomUserDetails} como
 * principal de la request. No emite respuestas — los rechazos los maneja
 * {@code FhirAuthenticationEntryPoint}.
 */
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER = "Bearer ";

    private final JwtDecoder jwtDecoder;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(AUTH_HEADER);
        if (header == null || !header.startsWith(BEARER)) {
            chain.doFilter(request, response);
            return;
        }
        String token = header.substring(BEARER.length());
        try {
            Jwt jwt = jwtDecoder.decode(token);
            if (!"ACCESS".equals(jwt.getClaimAsString("purpose"))) {
                log.debug("Token rechazado: purpose distinto de ACCESS");
                chain.doFilter(request, response);
                return;
            }
            MDC.put("jti", jwt.getId());
            CustomUserDetails principal = (CustomUserDetails) userDetailsService.loadUserByUsername(jwt.getSubject());
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
            chain.doFilter(request, response);
        } catch (JwtException | UsernameNotFoundException e) {
            log.debug("Token inválido: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            chain.doFilter(request, response);
        } finally {
            MDC.remove("jti");
        }
    }
}
