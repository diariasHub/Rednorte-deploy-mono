package cl.rednorte.ms_rednorte_api_gateway;

import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.rewritePath;
import static org.springframework.cloud.gateway.server.mvc.filter.LoadBalancerFilterFunctions.lb;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;
import static org.springframework.cloud.gateway.server.mvc.predicate.GatewayRequestPredicates.path;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

@Configuration
public class GatewayConfig {

        @Bean
        public RouterFunction<ServerResponse> customRoutes() {
                return route("ruta-agenda")
                                .route(path("/agendas/**"), http())
                                .filter(lb("AGENDA"))
                                .build()
                                .and(route("ruta-pacientes")
                                                .route(path("/api/v1/patients")
                                                                .or(path("/api/v1/patients/**"))
                                                                .or(path("/api/v1/coverages"))
                                                                .or(path("/api/v1/coverages/**"))
                                                                .or(path("/internal/patients"))
                                                                .or(path("/internal/patients/**")), http())
                                                .filter(lb("MS-PACIENTE"))
                                                .build())
                                .and(route("ruta-login-user")
                                                .route(path("/api/v1/auth")
                                                                .or(path("/api/v1/auth/**"))
                                                                .or(path("/api/v1/users"))
                                                                .or(path("/api/v1/users/**"))
                                                                .or(path("/api/v1/roles"))
                                                                .or(path("/api/v1/roles/**"))
                                                                .or(path("/api/users"))
                                                                .or(path("/api/users/**"))
                                                                .or(path("/api/roles"))
                                                                .or(path("/api/roles/**"))
                                                                .or(path("/auth"))
                                                                .or(path("/auth/**"))
                                                                .or(path("/internal/users"))
                                                                .or(path("/internal/users/**")), http())
                                                .before(rewritePath("/api/v1/auth/(?<segment>.*)", "/auth/${segment}"))
                                                .before(rewritePath("/api/v1/auth", "/auth"))
                                                .before(rewritePath("/api/v1/users/(?<segment>.*)", "/api/users/${segment}"))
                                                .before(rewritePath("/api/v1/users", "/api/users"))
                                                .before(rewritePath("/api/v1/roles/(?<segment>.*)", "/api/roles/${segment}"))
                                                .before(rewritePath("/api/v1/roles", "/api/roles"))
                                                .filter(lb("MS-LOGIN-USER"))
                                                .build())
                                .and(route("ruta-ficha")
                                                .route(path("/api/v1/**"), http())
                                                .filter(lb("MS-FICHA-CLINICA"))
                                                .build())
                                .and(route("ruta-centros")
                                                .route(path("/centros/**"), http())
                                                .filter(lb("MS-RED-CENTROS"))
                                                .build())
                                .and(route("ruta-urgencias")
                                                .route(path("/urgencias/**"), http())
                                                .filter(lb("MS-URGENCIAS-FLUJO"))
                                                .build())
                                .and(route("ruta-usuarios")
                                                .route(path("/api/v2/**"), http())
                                                .filter(lb("MS-USUARIOS"))
                                                .build())
                                .and(route("api-docs-pacientes")
                                                .route(path("/api-docs/pacientes"), http())
                                                .before(rewritePath("/api-docs/pacientes", "/v3/api-docs"))
                                                .filter(lb("MS-PACIENTE"))
                                                .build())
                                .and(route("api-docs-login-user")
                                                .route(path("/api-docs/login-user"), http())
                                                .before(rewritePath("/api-docs/login-user", "/v3/api-docs"))
                                                .filter(lb("MS-LOGIN-USER"))
                                                .build())
                                .and(route("api-docs-ficha-clinica")
                                                .route(path("/api-docs/ficha-clinica"), http())
                                                .before(rewritePath("/api-docs/ficha-clinica", "/v3/api-docs"))
                                                .filter(lb("MS-FICHA-CLINICA"))
                                                .build())
                                .and(route("api-docs-red-centros")
                                                .route(path("/api-docs/red-centros"), http())
                                                .before(rewritePath("/api-docs/red-centros", "/v3/api-docs"))
                                                .filter(lb("MS-RED-CENTROS"))
                                                .build())
                                .and(route("api-docs-urgencias-flujo")
                                                .route(path("/api-docs/urgencias-flujo"), http())
                                                .before(rewritePath("/api-docs/urgencias-flujo", "/v3/api-docs"))
                                                .filter(lb("MS-URGENCIAS-FLUJO"))
                                                .build())
                                .and(route("api-docs-usuarios")
                                                .route(path("/api-docs/usuarios"), http())
                                                .before(rewritePath("/api-docs/usuarios", "/v3/api-docs"))
                                                .filter(lb("MS-USUARIOS"))
                                                .build())
                                .and(route("api-docs-agenda")
                                                .route(path("/api-docs/agenda"), http())
                                                .before(rewritePath("/api-docs/agenda", "/v3/api-docs"))
                                                .filter(lb("AGENDA"))
                                                .build())
                ;
        }

        @Bean
        public CorsFilter corsFilter() {
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowCredentials(true);
                config.addAllowedOrigin("http://localhost:3000");
                config.addAllowedOrigin("http://localhost:5173");
                config.addAllowedHeader("*");
                config.addAllowedMethod("*");
                source.registerCorsConfiguration("/**", config);
                return new CorsFilter(source);
        }
}