import { useState, useEffect } from 'react';
import { User, ArrowRight, ArrowLeft, Phone, Mail, Loader2, Calendar as CalendarIcon } from 'lucide-react'; // 👇 NUEVO: Importé CalendarIcon
import { BookingData } from '../../../types/Booking';
import { PREVISION_OPTIONS, validateRun, formatRun } from '../../../../core/constants/BookingConst';
import { patientRemote } from '../../../../remotes/patient.remote';
import { coverageLabel } from '../../../../remotes/dtos/patient.dto';
import { toast } from 'sonner';

interface Step1IdentificacionProps {
  data: Partial<BookingData>;
  onChange: (fields: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// 🇨🇱 Lista de contingencia con las opciones estándar de Chile
const PREVISIONES_CHILE_DEFAULT = [
  'Fonasa',
  'Isapre Banmédica',
  'Isapre Colmena',
  'Isapre CruzBlanca',
  'Isapre Consalud',
  'Particular'
];

export function Step1Identificacion({ data, onChange, onNext, onBack }: Step1IdentificacionProps) {
  const [idType,     setIdType]     = useState<BookingData['idType']>(data.idType     ?? 'RUN');
  const [identifier, setIdentifier] = useState(data.identifier ?? '');
  const [prevision,  setPrevision]  = useState(data.prevision  ?? '');
  const [firstName,  setFirstName]  = useState(data.firstName  ?? '');
  const [lastName,   setLastName]   = useState(data.lastName   ?? '');
  const [phone,      setPhone]      = useState(data.phone      ?? '');
  const [email,      setEmail]      = useState(data.email      ?? '');
  const [birthDate,  setBirthDate]  = useState(data.birthDate  ?? ''); // 👇 NUEVO: Estado para la fecha de nacimiento
  const [error,      setError]      = useState('');

  // Estados para coberturas y búsqueda
  const [coverageOptions,  setCoverageOptions]  = useState<string[]>(PREVISION_OPTIONS);
  const [loadingCoverages, setLoadingCoverages] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Cargar opciones de previsión al iniciar
  useEffect(() => {
    patientRemote.getCoverages()
      .then(dtos => {
        if (dtos.length > 0) {
          const labels = [...new Set(dtos.map(coverageLabel))].sort();
          if (!labels.includes('Particular')) labels.push('Particular');
          setCoverageOptions(labels);
        }
      })
      .catch(() => { /* fallback hardcoded */ })
      .finally(() => setLoadingCoverages(false));
  }, []);

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (idType === 'RUN') {
      const clean = val.replace(/[^0-9kK]/g, '');
      if (clean.length > 9) return;
      val = clean.length >= 2 ? formatRun(clean) : clean;
    }
    setIdentifier(val);
    setError('');
  };

  // Buscar paciente al salir del input (On Blur)
  const handleIdentifierBlur = async () => {
    if (idType !== 'RUN' || !validateRun(identifier)) return;
    
    const rawRun = identifier.replace(/[^0-9kK]/g, '').toUpperCase();
    setIsSearching(true);
    
    try {
      // 1. Obtenemos el paciente tipado desde el HAPI FHIR
      const patient = await patientRemote.getPatientByRut(rawRun);
      
      // 2. Extraemos la previsión real resuelta por el remote
      const pacientePrevision = patient.prevision || 'Particular';
      
      // 3. Buscamos concordancia exacta en las opciones disponibles en el componente
      const matchPrevision = opcionesPrevisionRender.find(o => o.toLowerCase() === pacientePrevision.toLowerCase()) ?? pacientePrevision;

      // 4. Actualizamos el renderizado visual de los inputs locales
      setPrevision(matchPrevision);
      setFirstName(patient.name || patient.firstName || ''); 
      setLastName(patient.lastName || '');
      setPhone(patient.phone || '');
      setEmail(patient.email || '');
      setBirthDate(patient.birthDate || ''); // 👇 NUEVO: Cargar fecha de nacimiento si existe en FHIR

      // 🔥 EXCLUSIVO: Sincronizamos inmediatamente con el estado del Wizard principal
      onChange({
        identifier: rawRun,
        idType,
        prevision: matchPrevision,
        firstName: patient.name || patient.firstName || '',
        lastName: patient.lastName || '',
        phone: patient.phone || '',
        email: patient.email || '',
        birthDate: patient.birthDate || '' // 👇 NUEVO: Sincronizar al wizard
      });

      toast.success('Paciente encontrado', {
        description: `Bienvenido de vuelta, ${patient.name || patient.firstName || 'paciente'}.`
      });

    } catch (err) {
      // 404 - Paciente no registrado (Limpieza de inputs para registro nuevo)
      toast.info('Paciente no registrado', {
        description: 'Por favor, completa tus datos para continuar.'
      });
      
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setPrevision(''); 
      setBirthDate(''); // 👇 NUEVO: Limpiar fecha

      onChange({
        prevision: '',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        birthDate: '' // 👇 NUEVO: Limpiar en el wizard
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleNext = () => {
    if (idType === 'RUN' && !validateRun(identifier)) {
      setError('RUN inválido. El formato o dígito verificador es incorrecto.');
      return;
    }
    setError('');
    // 👇 NUEVO: Agregar birthDate al enviar al siguiente paso
    onChange({ identifier, prevision, idType, firstName, lastName, phone, email, birthDate });
    onNext();
  };

  const isValid =
    identifier.length >= 8 &&
    prevision !== '' &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    birthDate !== ''; // 👇 NUEVO: Obligar a que ponga la fecha

  // Filtro inteligente para las previsiones
  const opcionesPrevisionRender = !coverageOptions || coverageOptions.length === 0 || (coverageOptions.length === 1 && coverageOptions[0] === 'Particular')
    ? PREVISIONES_CHILE_DEFAULT
    : coverageOptions;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-[#5bc0eb] uppercase mb-1 flex items-center gap-1">
          <User size={13} /> Paso 1 de 4
        </p>
        <h2 className="text-xl font-semibold text-[#0b3c5d]">Identificación del Paciente</h2>
        <p className="text-sm text-slate-500 mt-1">Ingresa los datos del paciente para la reserva.</p>
      </div>

      <hr className="border-slate-100" />

      {/* ── Identificación ── */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-[#0b3c5d] mb-2 uppercase tracking-wide">
            Tipo de Identificación
          </label>
          <div className="flex gap-4">
            {(['RUN', 'PASAPORTE'] as const).map(type => (
              <label key={type} className="flex items-center gap-2 text-sm text-slate-600 font-medium cursor-pointer">
                <input
                  type="radio"
                  checked={idType === type}
                  onChange={() => { setIdType(type); setIdentifier(''); setError(''); }}
                  className="accent-[#0b3c5d]"
                />
                {type === 'RUN' ? 'RUN' : 'Pasaporte'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0b3c5d] mb-1">
            {idType === 'RUN' ? 'RUN' : 'Pasaporte'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={identifier}
              onChange={handleIdentifierChange}
              onBlur={handleIdentifierBlur}
              disabled={isSearching}
              className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all font-mono tracking-wide disabled:opacity-60 disabled:bg-slate-50
                ${error
                  ? 'border-red-400 ring-2 ring-red-100'
                  : 'border-slate-200 focus:ring-2 focus:ring-[#5bc0eb]/20 focus:border-[#5bc0eb]'
                }`}
              placeholder={idType === 'RUN' ? 'Ej: 12.345.678-9' : 'Ej: A1234567'}
              maxLength={idType === 'RUN' ? 12 : 20}
              inputMode={idType === 'RUN' ? 'numeric' : 'text'}
            />
            {isSearching && (
              <div className="absolute right-4 top-3.5 text-[#5bc0eb]">
                <Loader2 className="animate-spin" size={20} />
              </div>
            )}
          </div>
          
          {idType === 'RUN' && !error ? (
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M6 5.5v3M6 3.5v.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Solo ingresa números — puntos y guión se agregan solos.
            </p>
          ) : (
            error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0b3c5d] mb-1">Previsión</label>
          <select
            value={prevision}
            onChange={(e) => {
              const val = e.target.value;
              setPrevision(val);
              onChange({ prevision: val });
            }}
            disabled={loadingCoverages || isSearching}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5bc0eb]/20 focus:border-[#5bc0eb] outline-none transition-all bg-white disabled:opacity-60"
          >
            <option value="">
              {loadingCoverages ? 'Cargando coberturas…' : 'Seleccione previsión'}
            </option>
            
            {opcionesPrevisionRender.map((opt, index) => (
              <option key={`opt-${index}`} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* ── Datos de contacto ── */}
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Datos del paciente
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#0b3c5d] mb-1">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isSearching}
              placeholder="Ej: Juan"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5bc0eb]/20 focus:border-[#5bc0eb] outline-none transition-all disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0b3c5d] mb-1">
              Apellido <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isSearching}
              placeholder="Ej: Pérez"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5bc0eb]/20 focus:border-[#5bc0eb] outline-none transition-all disabled:opacity-60"
            />
          </div>
        </div>

        {/* 👇 NUEVO: Input de Fecha de Nacimiento */}
        <div>
          <label className="text-sm font-medium text-[#0b3c5d] mb-1 flex items-center gap-1.5">
            <CalendarIcon size={13} className="text-slate-400" /> Fecha de Nacimiento <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => {
              setBirthDate(e.target.value);
              onChange({ birthDate: e.target.value });
            }}
            disabled={isSearching}
            max={new Date().toISOString().split("T")[0]} // Evita fechas futuras
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5bc0eb]/20 focus:border-[#5bc0eb] outline-none transition-all disabled:opacity-60 text-slate-700"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-[#0b3c5d] mb-1 flex items-center gap-1.5">
              <Phone size={13} className="text-slate-400" /> Teléfono
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSearching}
              placeholder="+56 9 1234 5678"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5bc0eb]/20 focus:border-[#5bc0eb] outline-none transition-all disabled:opacity-60"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#0b3c5d] mb-1 flex items-center gap-1.5">
              <Mail size={13} className="text-slate-400" /> Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSearching}
              placeholder="correo@ejemplo.cl"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#5bc0eb]/20 focus:border-[#5bc0eb] outline-none transition-all disabled:opacity-60"
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Los campos con <span className="text-red-400 font-bold">*</span> son obligatorios.
          El teléfono y correo se usarán para notificarte la confirmación.
        </p>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-slate-200">
        <button
          onClick={onBack}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-300 text-base font-bold text-slate-600 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft size={20} /> Cancelar y volver
        </button>
        <button
          onClick={handleNext}
          disabled={!isValid || isSearching}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-base font-bold transition-all shadow-md
            ${isValid && !isSearching
              ? 'bg-[#0b3c5d] text-white hover:bg-[#0e4d76]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
        >
          Continuar al Paso 2 <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}