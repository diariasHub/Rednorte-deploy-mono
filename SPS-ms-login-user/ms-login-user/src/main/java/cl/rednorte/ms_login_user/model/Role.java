package cl.rednorte.ms_login_user.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Role {

    // Nombres de rol soportados en iteración 1. Se almacenan como String en BD
    // para permitir extender el catálogo sin migración estructural.
    public static final String MEDICO_URGENCIA = "MEDICO_URGENCIA";
    public static final String ENFERMERA_URGENCIA = "ENFERMERA_URGENCIA";
    public static final String ADMIN = "ADMIN";
    public static final String INTEGRACION = "INTEGRACION";
    public static final String PATIENT = "PATIENT";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roleId;

    @Column(unique = true, nullable = false, length = 50)
    private String name;

    @Column(length = 200)
    private String description;
}
