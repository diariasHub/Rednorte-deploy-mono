package com.ms_agenda_profesional.agenda.repository;

import com.ms_agenda_profesional.agenda.model.AppointmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, String> {
    List<AppointmentEntity> findByDrId(String drId);
}
