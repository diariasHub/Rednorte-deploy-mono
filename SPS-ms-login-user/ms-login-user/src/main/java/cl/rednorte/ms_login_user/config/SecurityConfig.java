package cl.rednorte.ms_login_user.config;

import ca.uhn.fhir.context.FhirContext;
import cl.rednorte.ms_login_user.auth.config.CorsProperties;
import cl.rednorte.ms_login_user.auth.config.SecurityProperties;
import cl.rednorte.ms_login_user.auth.security.RateLimitingFilter;
import cl.rednorte.ms_login_user.security.FhirAccessDeniedHandler;
import cl.rednorte.ms_login_user.security.FhirAuthenticationEntryPoint;
import cl.rednorte.ms_login_user.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final FhirAuthenticationEntryPoint authEntryPoint;
    private final FhirAccessDeniedHandler accessDeniedHandler;
    private final ObjectProvider<JwtDecoder> jwtDecoderProvider;
    private final ObjectProvider<UserDetailsService> userDetailsServiceProvider;
    private final SecurityProperties securityProperties;
    private final FhirContext fhirContext;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(eh -> eh
                    .authenticationEntryPoint(authEntryPoint)
                    .accessDeniedHandler(accessDeniedHandler))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/login", "/auth/otp", "/auth/refresh").permitAll()
                .requestMatchers("/auth/patient/request-otp", "/auth/patient/verify-otp").permitAll()
                .requestMatchers("/.well-known/jwks.json").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/internal/**").hasRole(cl.rednorte.ms_login_user.model.Role.INTEGRACION)
                .anyRequest().authenticated()
            )
            .headers(h -> h
                    // H2 console usa frames del mismo origen.
                    .frameOptions(f -> f.sameOrigin())
                    .contentTypeOptions(c -> {}) // X-Content-Type-Options: nosniff
                    .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                    .httpStrictTransportSecurity(hsts -> hsts
                            .includeSubDomains(true)
                            .maxAgeInSeconds(31_536_000)) // 1 año
            );

        // Rate limit por IP en endpoints de auth (antes del filter chain de Spring Security).
        http.addFilterBefore(new RateLimitingFilter(securityProperties, fhirContext),
                UsernamePasswordAuthenticationFilter.class);

        // El filtro JWT solo se enchufa si están disponibles los beans (perfil dev).
        JwtDecoder decoder = jwtDecoderProvider.getIfAvailable();
        UserDetailsService uds = userDetailsServiceProvider.getIfAvailable();
        if (decoder != null && uds != null) {
            http.addFilterBefore(new JwtAuthenticationFilter(decoder, uds),
                    UsernamePasswordAuthenticationFilter.class);
        }
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public CorsFilter corsFilter(CorsProperties corsProperties) {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(corsProperties.isAllowCredentials());
        config.setAllowedOrigins(corsProperties.getAllowedOrigins());
        config.setAllowedMethods(corsProperties.getAllowedMethods());
        config.setAllowedHeaders(corsProperties.getAllowedHeaders());
        config.setMaxAge(corsProperties.getMaxAgeSeconds());
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
