package cl.rednorte.ms_login_user.repository;

import cl.rednorte.ms_login_user.model.PatientOtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientOtpChallengeRepository extends JpaRepository<PatientOtpChallenge, Long> {

    Optional<PatientOtpChallenge> findFirstByRutAndUsedFalseOrderByCreatedAtDesc(String rut);

    /** Marca como usados todos los challenges activos del RUT (al pedir uno nuevo). */
    @Modifying
    @Query("update PatientOtpChallenge c set c.used = true where c.rut = :rut and c.used = false")
    int invalidateActiveByRut(@Param("rut") String rut);
}
