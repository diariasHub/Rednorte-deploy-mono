package cl.rednorte.ms_login_user.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Valida el RateLimitingFilter sobre POST /auth/login. Contexto aislado
 * con capacidad baja (3) vía @TestPropertySource para no contaminar los
 * buckets de los otros tests que comparten contexto Spring.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@TestPropertySource(properties = {
        "app.security.rate-limit.login-attempts=3",
        "app.security.rate-limit.window-seconds=60"
})
class RateLimitingTest {

    @Autowired MockMvc mvc;

    @Test
    void login_repetido_superaLimite_devuelve429ConOperationOutcome() throws Exception {
        String badLogin = """
                {"username":"medico.demo","password":"password-incorrecta"}
                """;
        // 3 intentos consumen el bucket → todos 401 por credencial errónea.
        for (int i = 0; i < 3; i++) {
            mvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(badLogin))
                    .andExpect(status().isUnauthorized());
        }
        // 4to intento rechazado por rate limit antes de evaluar credencial.
        mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(badLogin))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.resourceType").value("OperationOutcome"))
                .andExpect(jsonPath("$.issue[0].code").value("throttled"));
    }
}
