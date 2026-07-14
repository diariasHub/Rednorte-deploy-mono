import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, AlertCircle, Home } from 'lucide-react';
import { appointmentsRemote } from '../../../../remotes/appointments.remote';

export function ConfirmacionView() {
  const id = new URLSearchParams(window.location.search).get('id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!id) {
      setStatus('error');
      return;
    }

    const confirmAppointment = async () => {
      try {
        await appointmentsRemote.updateStatus(id, 'booked');
        setStatus('success');
      } catch (error) {
        console.error('Error confirming appointment:', error);
        setStatus('error');
      }
    };

    confirmAppointment();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="w-20 h-20 bg-[#004a87]/10 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-[#004a87] animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
          )}
        </div>

        {status === 'loading' && (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Confirmando tu cita...</h1>
            <p className="text-slate-500">Por favor, espera un momento mientras validamos la información.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">¡Cita Confirmada!</h1>
            <p className="text-slate-500 mb-8">
              Tu hora médica ha sido confirmada exitosamente. Te esperamos en el centro médico el día de tu cita. 
              Recuerda llegar con 15 minutos de anticipación.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-[#004a87] hover:bg-[#003666] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Home size={18} /> Volver al Inicio
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Error de Confirmación</h1>
            <p className="text-slate-500 mb-8">
              No pudimos confirmar tu cita. Es posible que el enlace sea inválido o haya expirado. 
              Por favor, intenta nuevamente o contacta a soporte.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Home size={18} /> Volver al Inicio
            </button>
          </>
        )}

      </div>
    </div>
  );
}
