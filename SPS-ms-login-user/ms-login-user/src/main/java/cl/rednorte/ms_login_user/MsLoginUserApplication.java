package cl.rednorte.ms_login_user;

import cl.rednorte.ms_login_user.auth.config.CorsProperties;
import cl.rednorte.ms_login_user.auth.config.SecurityProperties;
import cl.rednorte.ms_login_user.integration.paciente.PacienteClientProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties({SecurityProperties.class, PacienteClientProperties.class, CorsProperties.class})
public class MsLoginUserApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsLoginUserApplication.class, args);
    }
}
