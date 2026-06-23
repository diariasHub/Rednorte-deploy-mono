package cl.rednorte.ms_login_user.auth;

import cl.rednorte.ms_login_user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class AuthFlowIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;

    @AfterEach
    void resetLockout() {
        userRepository.findByUsername("medico.demo").ifPresent(u -> {
            u.setFailedLoginAttempts(0);
            u.setLockedUntil(null);
            userRepository.save(u);
        });
    }

    @Test
    void login_OK_retornaJwtRs256ConRoles() throws Exception {
        MvcResult res = mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"medico.demo","password":"Demo1234!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andReturn();

        JsonNode body = objectMapper.readTree(res.getResponse().getContentAsString());
        String access = body.get("accessToken").asText();

        // Header del JWT: alg=RS256, kid presente.
        String header = new String(java.util.Base64.getUrlDecoder().decode(access.split("\\.")[0]));
        assertThat(header).contains("\"alg\":\"RS256\"");
        assertThat(header).contains("\"kid\"");

        // Payload: subject = medico.demo, claim roles incluye ROLE_MEDICO_URGENCIA.
        String payload = new String(java.util.Base64.getUrlDecoder().decode(access.split("\\.")[1]));
        assertThat(payload).contains("\"sub\":\"medico.demo\"");
        assertThat(payload).contains("ROLE_MEDICO_URGENCIA");
    }

    @Test
    void login_passwordMal_devuelve401ConOperationOutcome() throws Exception {
        mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"medico.demo","password":"contrasenia-erronea"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.resourceType").value("OperationOutcome"))
                .andExpect(jsonPath("$.issue[0].severity").value("error"));
    }

    @Test
    void login_cincoIntentosFallidos_bloqueaCuenta() throws Exception {
        String badLogin = """
                {"username":"medico.demo","password":"contrasenia-erronea"}
                """;
        for (int i = 0; i < 5; i++) {
            mvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(badLogin))
                    .andExpect(status().isUnauthorized());
        }
        // El 5° intento dispara el bloqueo (reset attempts a 0 y locked_until en futuro).
        var user = userRepository.findByUsername("medico.demo").orElseThrow();
        assertThat(user.getLockedUntil()).isNotNull();
        assertThat(user.getLockedUntil()).isAfter(java.time.Instant.now());

        // Y el siguiente intento, aunque la password fuera correcta, falla.
        mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"medico.demo","password":"Demo1234!"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void internal_users_conTokenSvc_retornaUserDto() throws Exception {
        // 1. Login como service account.
        String svcLogin = mvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"ms-usuarios-svc","password":"Svc-Demo-1234!"}
                                """))
                .andReturn().getResponse().getContentAsString();
        String svcToken = objectMapper.readTree(svcLogin).get("accessToken").asText();

        // 2. GET /internal/users/by-username/medico.demo con Bearer svc.
        mvc.perform(get("/internal/users/by-username/medico.demo")
                        .header("Authorization", "Bearer " + svcToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("medico.demo"))
                .andExpect(jsonPath("$.email").value("medico.demo@rednorte.cl"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.roles", org.hamcrest.Matchers.hasItem("MEDICO_URGENCIA")))
                // Ningún campo sensible:
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.mfaSecret").doesNotExist());
    }

    @Test
    void internal_users_sinToken_devuelve401() throws Exception {
        mvc.perform(get("/internal/users/by-username/medico.demo"))
                .andExpect(status().isUnauthorized());
    }
}
