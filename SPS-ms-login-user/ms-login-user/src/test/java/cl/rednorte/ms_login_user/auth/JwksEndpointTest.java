package cl.rednorte.ms_login_user.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class JwksEndpointTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void jwks_publicaSoloPartePublicaDeLaClave() throws Exception {
        String body = mvc.perform(get("/.well-known/jwks.json"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.keys[0].kty").value("RSA"))
                .andExpect(jsonPath("$.keys[0].alg").value("RS256"))
                .andExpect(jsonPath("$.keys[0].use").value("sig"))
                .andExpect(jsonPath("$.keys[0].kid").isNotEmpty())
                .andExpect(jsonPath("$.keys[0].n").isNotEmpty())
                .andExpect(jsonPath("$.keys[0].e").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(body);

        // Crítico: NO debe filtrarse la clave privada (d, p, q, dp, dq, qi).
        JsonNode key = root.get("keys").get(0);
        for (String privateField : new String[]{"d", "p", "q", "dp", "dq", "qi"}) {
            assertThat(key.has(privateField))
                    .as("La parte privada '%s' NO debe exponerse en JWKS", privateField)
                    .isFalse();
        }
    }

    @Test
    void jwks_esAccesibleSinAutenticacion() throws Exception {
        mvc.perform(get("/.well-known/jwks.json"))
                .andExpect(status().isOk());
    }
}
