import { appointmentsRemote } from '../remotes/appointments.remote';
import type { AppointmentDTO, CreateAppointmentDTO } from '../remotes/dtos/appointment.dto';
import type { BookingData } from '../app/types/Booking';

class AppointmentService {
  // Converts wizard BookingData into the backend DTO and submits to ms-reservas
  bookAppointment(data: Partial<BookingData>): Promise<AppointmentDTO> {
    const startDate = new Date(`${data.date}T${data.slot}:00`);
    const endDate   = new Date(startDate.getTime() + 30 * 60 * 1000);

    const patientLabel =
      data.firstName && data.lastName
        ? `${data.firstName} ${data.lastName}`
        : (data.identifier ?? 'Desconocido');

    // Mapeamos TODO lo que el bypass necesita recibir
    const dto: any = {
      patientId:        data.identifier?.replace(/[^0-9kK]/g, '').toUpperCase() ?? 'unknown',
      patientName:      data.firstName,       // 🔥 ¡AGREGADO!
      patientLastName:  data.lastName,        // 🔥 ¡AGREGADO!
      prevision:        data.prevision,       // 🔥 ¡AGREGADO!
      date:             data.date,            // 🔥 ¡AGREGADO! Evita que sea siempre 2026-06-15
      slot:             data.slot,            // 🔥 ¡AGREGADO! Evita que sea siempre 13:00 hrs
      practitionerId:   data.doctorId ?? data.specialtyId ?? 'unknown',
      start:            startDate.toISOString(),
      end:              endDate.toISOString(),
      status:           'booked',
      description: [
        data.appointmentType === 'TELEMEDICINA' ? 'Telemedicina' : 'Presencial',
        `Especialidad: ${data.specialtyName ?? 'sin especificar'}`,
        `Paciente: ${patientLabel}`,
        data.doctorName ? `Médico: ${data.doctorName}` : null,
      ].filter(Boolean).join(' · '),
    };

    return appointmentsRemote.create(dto);
  }

  getAll(): Promise<AppointmentDTO[]> {
    return appointmentsRemote.getAll();
  }

  getById(id: string): Promise<AppointmentDTO> {
    return appointmentsRemote.getById(id);
  }

  getByPatient(patientId: string): Promise<AppointmentDTO[]> {
    return appointmentsRemote.getByPatient(patientId);
  }

  getByPractitioner(practitionerId: string): Promise<AppointmentDTO[]> {
    return appointmentsRemote.getByPractitioner(practitionerId);
  }

  update(id: string, dto: Partial<AppointmentDTO>): Promise<AppointmentDTO> {
    return appointmentsRemote.update(id, dto);
  }

  updateTime(id: string, date: string, time: string): Promise<any> {
    const startDate = new Date(`${date}T${time}:00`);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
    return appointmentsRemote.updateTime(id, startDate.toISOString(), endDate.toISOString());
  }

  cancel(id: string): Promise<void> {
    return appointmentsRemote.cancel(id);
  }
}

export const appointmentService = new AppointmentService();
