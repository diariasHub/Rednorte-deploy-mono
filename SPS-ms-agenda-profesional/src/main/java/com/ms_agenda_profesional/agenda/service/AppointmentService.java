package com.ms_agenda_profesional.agenda.service;

import com.ms_agenda_profesional.agenda.model.AppointmentEntity;
import com.ms_agenda_profesional.agenda.repository.AppointmentRepository;
import com.ms_agenda_profesional.dto.AppointmentDTO;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository repository;

    public AppointmentService(AppointmentRepository repository) {
        this.repository = repository;
    }

    @Cacheable(value = "appointments", key = "#drId")
    public List<AppointmentDTO> getAppointmentsByDoctor(String drId) {
        return repository.findByDrId(drId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "appointments", key = "'all'")
    public List<AppointmentDTO> getAllAppointments() {
        return repository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "appointments", allEntries = true)
    public void saveAppointment(AppointmentEntity entity) {
        repository.save(entity);
    }

    @CacheEvict(value = "appointments", allEntries = true)
    public void updateStatus(String id, String status) {
        repository.findById(id).ifPresent(app -> {
            app.setStatus(status);
            repository.save(app);
        });
    }

    @CacheEvict(value = "appointments", allEntries = true)
    public void updateTime(String id, String start) {
        repository.findById(id).ifPresent(app -> {
            app.setStart(start);
            repository.save(app);
        });
    }

    public void saveAll(List<AppointmentEntity> entities) {
        repository.saveAll(entities);
    }
    
    public boolean hasDataForDoctor(String drId) {
        return !repository.findByDrId(drId).isEmpty();
    }

    public boolean hasAnyData() {
        return repository.count() > 0;
    }

    private AppointmentDTO mapToDTO(AppointmentEntity entity) {
        return new AppointmentDTO(
                entity.getId(),
                entity.getPatientId(),
                entity.getPatientName(),
                entity.getPatientRut(),
                entity.getStart(),
                entity.getStatus(),
                entity.getPatientAge(),
                entity.getPatientPhone(),
                entity.getPatientEmail()
        );
    }
}
