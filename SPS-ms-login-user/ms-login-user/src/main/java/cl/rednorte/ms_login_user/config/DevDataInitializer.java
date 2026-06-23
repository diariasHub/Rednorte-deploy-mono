package cl.rednorte.ms_login_user.config;

import cl.rednorte.ms_login_user.model.Role;
import cl.rednorte.ms_login_user.model.User;
import cl.rednorte.ms_login_user.repository.RoleRepository;
import cl.rednorte.ms_login_user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Datos mínimos para dev: catálogo de roles + usuario médico de prueba.
 * Solo en perfil dev y solo si las tablas están vacías. Los recursos
 * clínicos (Patient/Practitioner) viven en otros MS y se siembran allá.
 */
@Slf4j
@Profile("dev")
@Component
@RequiredArgsConstructor
public class DevDataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedMedicoDemo();
        seedServiceAccount("ms-usuarios-svc", Role.INTEGRACION,
                "ms-usuarios-svc@svc.rednorte.cl");
    }

    private void seedRoles() {
        ensureRole(Role.MEDICO_URGENCIA, "Médico de urgencias");
        ensureRole(Role.ENFERMERA_URGENCIA, "Enfermera/o de urgencias");
        ensureRole(Role.ADMIN, "Administrador del sistema (sin acceso clínico)");
        ensureRole(Role.INTEGRACION, "Cuenta de integración máquina-a-máquina");
        ensureRole(Role.PATIENT, "Paciente auto-autenticado por RUT + OTP");
    }

    private void ensureRole(String name, String description) {
        roleRepository.findByName(name).orElseGet(() ->
                roleRepository.save(Role.builder().name(name).description(description).build())
        );
    }

    private void seedMedicoDemo() {
        if (userRepository.findByUsername("medico.demo").isPresent()) {
            return;
        }
        Role medico = roleRepository.findByName(Role.MEDICO_URGENCIA).orElseThrow();
        User user = User.builder()
                .username("medico.demo")
                .password(passwordEncoder.encode("Demo1234!"))
                .email("medico.demo@rednorte.cl")
                .active(true)
                .mfaEnabled(false)
                .failedLoginAttempts(0)
                .roles(Set.of(medico))
                .build();
        userRepository.save(user);
        log.info("Seed: usuario medico.demo creado (password: Demo1234!).");
    }

    /**
     * Cuenta de servicio para integración entre MS. En dev usa contraseña fija;
     * en prod se inyectaría por env var y se rotaría desde un secret manager.
     */
    private void seedServiceAccount(String username, String roleName, String email) {
        if (userRepository.findByUsername(username).isPresent()) {
            return;
        }
        Role role = roleRepository.findByName(roleName).orElseThrow();
        User svc = User.builder()
                .username(username)
                .password(passwordEncoder.encode("Svc-Demo-1234!"))
                .email(email)
                .active(true)
                .mfaEnabled(false)
                .failedLoginAttempts(0)
                .roles(Set.of(role))
                .build();
        userRepository.save(svc);
        log.info("Seed: service account {} creado (password: Svc-Demo-1234!).", username);
    }
}
