package cl.rednorte.ms_login_user.auth;

import cl.rednorte.ms_login_user.repository.PatientOtpChallengeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integración del flujo auto-login del paciente. ms-paciente es simulado
 * con WireMock; OTP se obtiene de la respuesta gracias a
 * {@code expose-in-response=true} del perfil dev.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class PatientAuthFlowTest {

    private static final WireMockServer wireMockServer;

    static {
        wireMockServer = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        wireMockServer.start();
        Runtime.getRuntime().addShutdownHook(new Thread(wireMockServer::stop));
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired PatientOtpChallengeRepository challengeRepository;

    @BeforeEach
    void resetState() {
        wireMockServer.resetAll();
        challengeRepository.deleteAll();
    }

    @DynamicPropertySource
    static void wireBaseUrl(DynamicPropertyRegistry registry) {
        registry.add("app.paciente.base-url", wireMockServer::baseUrl);
    }

    private void stubPacienteOk(String rut, String patientId, String phone) {
        wireMockServer.stubFor(WireMock.get(urlEqualTo("/internal/patients/by-rut/" + rut))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("""
                                {
                                  "id":"%s",
                                  "identifierType":"RUN",
                                  "identifierValue":"%s",
                                  "firstName":"Juan",
                                  "lastName":"Pérez",
                                  "phone":"%s",
                                  "email":"juan.perez@example.cl"
                                }
                                """.formatted(patientId, rut, phone))));
    }

    private void stubPacienteNotFound(String rut) {
        wireMockServer.stubFor(WireMock.get(urlEqualTo("/internal/patients/by-rut/" + rut))
                .willReturn(aResponse().withStatus(404)));
    }

    @Test
    void requestOtp_rutExistente_persisteChallengeYDevuelveDebugOtp() throws Exception {
        stubPacienteOk("12345678-9", "P-1", "+56912345678");

        MvcResult res = mvc.perform(post("/auth/patient/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rut":"12345678-9"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OTP_SENT"))
                .andExpect(jsonPath("$.debugOtp").isNotEmpty())
                .andReturn();

        String body = res.getResponse().getContentAsString();
        String otp = objectMapper.readTree(body).get("debugOtp").asText();
        assertThat(otp).matches("\\d{6}");

        // Challenge persistido.
        assertThat(challengeRepository.findFirstByRutAndUsedFalseOrderByCreatedAtDesc("12345678-9"))
                .isPresent()
                .hasValueSatisfying(c -> {
                    assertThat(c.getPatientId()).isEqualTo("P-1");
                    assertThat(c.getAttempts()).isZero();
                    assertThat(c.isUsed()).isFalse();
                });
    }

    @Test
    void requestOtp_rutInexistente_devuelveOkSinPersistir() throws Exception {
        stubPacienteNotFound("99999999-9");

        mvc.perform(post("/auth/patient/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rut":"99999999-9"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OTP_SENT"))
                .andExpect(jsonPath("$.debugOtp").doesNotExist());

        assertThat(challengeRepository.count()).isZero();
    }

    @Test
    void verifyOtp_codeValido_emiteTokenPatient() throws Exception {
        stubPacienteOk("12345678-9", "P-1", "+56912345678");
        String reqBody = mvc.perform(post("/auth/patient/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rut":"12345678-9"}
                                """))
                .andReturn().getResponse().getContentAsString();
        String otp = objectMapper.readTree(reqBody).get("debugOtp").asText();

        MvcResult verifyRes = mvc.perform(post("/auth/patient/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rut\":\"12345678-9\",\"code\":\"" + otp + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andReturn();

        String token = objectMapper.readTree(verifyRes.getResponse().getContentAsString())
                .get("accessToken").asText();
        // payload del JWT (claim patient_id y roles).
        String payload = new String(java.util.Base64.getUrlDecoder().decode(token.split("\\.")[1]));
        assertThat(payload).contains("\"patient_id\":\"P-1\"");
        assertThat(payload).contains("ROLE_PATIENT");
        assertThat(payload).contains("\"sub\":\"P-1\"");
    }

    @Test
    void verifyOtp_codeInvalido_devuelve401EIncrementaAttempts() throws Exception {
        stubPacienteOk("12345678-9", "P-1", "+56912345678");
        mvc.perform(post("/auth/patient/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rut":"12345678-9"}
                                """))
                .andExpect(status().isOk());

        mvc.perform(post("/auth/patient/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rut":"12345678-9","code":"000000"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.resourceType").value("OperationOutcome"));

        assertThat(challengeRepository.findFirstByRutAndUsedFalseOrderByCreatedAtDesc("12345678-9"))
                .isPresent()
                .hasValueSatisfying(c -> assertThat(c.getAttempts()).isEqualTo(1));
    }

    @Test
    void verifyOtp_challengeExpirado_devuelve401() throws Exception {
        stubPacienteOk("12345678-9", "P-1", "+56912345678");
        String body = mvc.perform(post("/auth/patient/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"rut":"12345678-9"}
                                """))
                .andReturn().getResponse().getContentAsString();
        String otp = objectMapper.readTree(body).get("debugOtp").asText();

        // Forzamos expiración del challenge persistido.
        challengeRepository.findFirstByRutAndUsedFalseOrderByCreatedAtDesc("12345678-9")
                .ifPresent(c -> {
                    c.setExpiresAt(Instant.now().minusSeconds(60));
                    challengeRepository.save(c);
                });

        mvc.perform(post("/auth/patient/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rut\":\"12345678-9\",\"code\":\"" + otp + "\"}"))
                .andExpect(status().isUnauthorized());
    }
}
