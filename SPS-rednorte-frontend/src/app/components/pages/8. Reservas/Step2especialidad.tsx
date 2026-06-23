import { useState, useEffect } from 'react';
import {
  Heart, Brain, Bone, Eye, Wind, Stethoscope,
  Baby, Activity, ArrowLeft, ArrowRight, CheckCircle2, Loader2
} from 'lucide-react';
import { BookingData, AppointmentType, Doctor } from '../../../types/Booking';
import { doctorInitials } from '../../../../core/constants/BookingConst';
import { medicalRemote, SpecialtyDTO } from '../../../../remotes/medical.remote';

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Heart, Brain, Bone, Eye, Wind, Stethoscope, Baby, Activity,
};

interface Step2EspecialidadProps {
  data: Partial<BookingData>;
  onChange: (fields: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Especialidad({ data, onChange, onNext, onBack }: Step2EspecialidadProps) {
  const appointmentType = data.appointmentType ?? 'PRESENCIAL';
  const specialtyId     = data.specialtyId     ?? '';

  // NUEVOS ESTADOS PARA DATOS REALES
  const [specialties, setSpecialties] = useState<SpecialtyDTO[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // EFECTO 1: Cargar especialidades al abrir el componente
  useEffect(() => {
    let isMounted = true;
    setLoadingSpecialties(true);
    
    medicalRemote.getSpecialties().then(data => {
      if (isMounted) {
        setSpecialties(data);
        setLoadingSpecialties(false);
      }
    });

    return () => { isMounted = false; };
  }, []);

  // EFECTO 2: Cargar doctores cuando se selecciona una especialidad
  useEffect(() => {
    if (!specialtyId) {
      setDoctors([]);
      return;
    }

    let isMounted = true;
    setLoadingDoctors(true);

    medicalRemote.getDoctorsBySpecialty(specialtyId).then(data => {
      if (isMounted) {
        setDoctors(data);
        setLoadingDoctors(false);
      }
    });

    return () => { isMounted = false; };
  }, [specialtyId]);

  function handleTypeChange(type: AppointmentType) {
    onChange({ appointmentType: type });
  }

  function handleSpecialtySelect(id: string, name: string) {
    if (id === specialtyId) return;
    // Resetea el doctor al cambiar de especialidad para evitar inconsistencias
    onChange({ specialtyId: id, specialtyName: name, doctorId: '', doctorName: '', doctorTitle: undefined });
  }

  function handleDoctorSelect(doctor: Doctor) {
    onChange({ doctorId: doctor.id, doctorName: doctor.name, doctorTitle: doctor.title });
  }

  const canProceed = specialtyId !== '' && (data.doctorId ?? '') !== '';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-[#5bc0eb] uppercase mb-1 flex items-center gap-1">
          <Stethoscope size={13} /> Paso 2 de 4
        </p>
        <h2 className="text-xl font-semibold text-[#0b3c5d]">Especialidad y profesional</h2>
        <p className="text-sm text-slate-500 mt-1">Selecciona el tipo de consulta, la especialidad y el médico.</p>
      </div>

      <hr className="border-slate-100" />

      {/* Modalidad (Sin cambios) */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Modalidad</p>
        <div className="flex gap-3">
          {(['PRESENCIAL', 'TELEMEDICINA'] as AppointmentType[]).map(type => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl border-[1.5px] transition-all text-sm font-medium
                ${appointmentType === type
                  ? 'border-[#5bc0eb] bg-[#eaf8ff] text-[#0b3c5d]'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                }`}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                  ${appointmentType === type ? 'border-[#5bc0eb]' : 'border-slate-300'}`}
              >
                {appointmentType === type && (
                  <span className="w-2 h-2 rounded-full bg-[#5bc0eb] block" />
                )}
              </span>
              {type === 'PRESENCIAL' ? 'Consulta presencial' : 'Telemedicina'}
            </button>
          ))}
        </div>
      </div>

      {/* Especialidades DINÁMICAS */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Especialidad</p>
        
        {loadingSpecialties ? (
          <div className="flex items-center justify-center py-8 text-[#5bc0eb]">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : specialties.length === 0 ? (
          <p className="text-sm text-slate-500">No hay especialidades disponibles en este momento.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(Array.isArray(specialties) ? specialties : []).map(spec => {
              const Icon       = ICON_MAP[spec.icon] ?? Activity; // Fallback a 'Activity' si el icono no existe
              const isSelected = specialtyId === spec.id;
              return (
                <button
                  key={spec.id}
                  onClick={() => handleSpecialtySelect(spec.id, spec.name)}
                  className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-[1.5px] transition-all text-center
                    ${isSelected
                      ? 'border-[#5bc0eb] bg-[#eaf8ff] shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                      ${isSelected ? 'bg-[#0b3c5d]' : 'bg-white border border-slate-200'}`}
                  >
                    <Icon size={20} className={isSelected ? 'text-white' : 'text-[#0b3c5d]'} />
                  </div>
                  <span
                    className={`text-xs font-semibold leading-tight transition-colors
                      ${isSelected ? 'text-[#0b3c5d]' : 'text-slate-600'}`}
                  >
                    {spec.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Profesionales disponibles DINÁMICOS */}
      {specialtyId && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Profesionales disponibles
          </p>
          
          {loadingDoctors ? (
            <div className="flex items-center justify-center py-8 text-[#5bc0eb]">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-sm text-slate-500 p-4 border border-dashed border-slate-300 rounded-xl text-center">
              No se encontraron profesionales para esta especialidad.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {doctors.map(doctor => {
                const isSelected = data.doctorId === doctor.id;
                const ini        = doctorInitials(doctor.name);
                const slotsColor =
                  (doctor.slots ?? 0) > 4  ? 'bg-[#e6f7f4] text-[#085041]' :
                  (doctor.slots ?? 0) > 0  ? 'bg-amber-50 text-amber-700'  :
                                              'bg-red-50 text-red-500';

                return (
                  <button
                    key={doctor.id}
                    onClick={() => handleDoctorSelect(doctor)}
                    className={`w-full text-left p-4 rounded-xl border-[1.5px] transition-all
                      ${isSelected
                        ? 'border-[#5bc0eb] bg-[#eaf8ff] shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors
                          ${isSelected ? 'bg-[#0b3c5d] text-white' : 'bg-slate-100 text-[#0b3c5d]'}`}
                      >
                        {ini}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-[#0b3c5d] truncate">{doctor.name}</p>
                              {isSelected && (
                                <CheckCircle2 size={14} className="shrink-0 text-[#5bc0eb]" />
                              )}
                            </div>
                            {doctor.title && (
                              <p className="text-xs text-slate-500 mt-0.5">{doctor.title}</p>
                            )}
                          </div>
                          {doctor.slots !== undefined && (
                            <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${slotsColor}`}>
                              {doctor.slots > 0 ? `${doctor.slots} horas` : 'Sin horas'}
                            </span>
                          )}
                        </div>

                        {doctor.bio && (
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{doctor.bio}</p>
                        )}

                        {doctor.experience !== undefined && (
                          <p className="text-[11px] text-slate-400 mt-1.5">
                            {doctor.experience} años de experiencia
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer (Sin cambios) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-slate-200">
        <button
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-300 text-base font-bold text-slate-600 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft size={20} /> Volver al Paso 1
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-base font-bold transition-all shadow-md
            ${canProceed
              ? 'bg-[#0b3c5d] text-white hover:bg-[#0e4d76]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
        >
          Continuar al Paso 3 <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}