import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Layers, Activity, Heart, Clipboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';

// Interfaces alineadas estrictamente con los DTOs de Java
interface EncounterDTO {
  id: string;
  patientId: string;
  locationId: string;
  status: string;
  periodStart: string;
  periodEnd?: string;
  practitioner: string;
}

interface ConditionDTO {
  // Nota: El backend actualmente no envía 'id' ni 'recordedDate' en ConditionDTO.java
  patientId: string;
  encounterId?: string;
  code: string; 
  clinicalStatus: string;
  description: string;
}

interface ObservationDTO {
  id: string;
  patientId: string;
  encounterId?: string;
  code: string; 
  value: number; // El backend envía un Double
  unit: string;
  effectiveDate: string;
}

interface ProcedureDTO {
  id: string;
  patientId: string;
  encounterId?: string;
  code: string; 
  status: string;
  performedDate: string;
  description: string;
}

interface ClinicalNoteDTO {
  id: string;
  patientId: string;
  encounterId?: string;
  content: string; // Corregido: antes era 'notes'
  author: string;
  createdAt: string;
}

interface ClinicalHistoryDTO {
  patientId: string;
  encounters: EncounterDTO[];
  conditions: ConditionDTO[];
  observations: ObservationDTO[];
  procedures: ProcedureDTO[];
  clinicalNotes: ClinicalNoteDTO[];
}

interface HistoryViewProps {
  patientId?: string;
}

export function HistoryView({ patientId = "p-196655077" }: HistoryViewProps) {
    const [history, setHistory] = useState<ClinicalHistoryDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'encounters' | 'conditions' | 'observations' | 'procedures' | 'notes'>('encounters');

  const API_GATEWAY_URL = '/api/v1/history/patient';
  useEffect(() => {
    setLoading(true);
    fetch(`${API_GATEWAY_URL}/${patientId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error en la respuesta del API Gateway');
        return res.json();
      })
      .then((data: ClinicalHistoryDTO) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-gray-600 font-medium text-sm">Consultando ficha clínica vía API Gateway...</p>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-red-800 border border-red-200">
        <p className="font-semibold">Error de Conexión Ecosistema RedNorte</p>
        <p className="text-xs mt-1 text-red-600">{error || 'No se han recuperado datos estructurados.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Ficha Clínica Digital</h2>
        <p className="text-gray-500 text-sm">
          Repositorio interoperable basado en el estándar <span className="font-semibold text-blue-600">HL7 FHIR</span> • ID Paciente: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-700">{history.patientId}</span>
        </p>
      </div>

      {/* Métrica de Tarjetas de Resumen Dinámico */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Atenciones (Encounters)</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{history.encounters?.length || 0}</div>
            <p className="text-xs text-gray-400 mt-0.5">Visitas e ingresos totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Diagnósticos (Conditions)</CardTitle>
            <Layers className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{history.conditions?.length || 0}</div>
            <p className="text-xs text-gray-400 mt-0.5">Patologías en registro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Exámenes y Signos (Observations)</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{history.observations?.length || 0}</div>
            <p className="text-xs text-gray-400 mt-0.5">Métricas e informes clínicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-gray-500 uppercase">Procedimientos (Procedures)</CardTitle>
            <Clipboard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{history.procedures?.length || 0}</div>
            <p className="text-xs text-gray-400 mt-0.5">Intervenciones realizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Selector de Pestañas FHIR */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {(['encounters', 'conditions', 'observations', 'procedures', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab === 'encounters' && 'Atenciones (Encounters)'}
              {tab === 'conditions' && 'Diagnósticos (Conditions)'}
              {tab === 'observations' && 'Biometría/Laboratorio (Observations)'}
              {tab === 'procedures' && 'Procedimientos'}
              {tab === 'notes' && 'Evolución Clínica (Notes)'}
            </button>
          ))}
        </nav>
      </div>

      {/* Renderizado de Bloques según recurso activo */}
      <div className="space-y-4">
        
        {/* ENCOUNTERS */}
        {activeTab === 'encounters' && (
          (!history.encounters || history.encounters.length === 0) ? <p className="text-gray-400 text-sm italic">No se registran encuentros de salud activos.</p> :
          history.encounters.map((enc) => (
            <Card key={enc.id}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Encuentro Clínico de Paciente #{enc.id}</h4>
                    <p className="text-xs text-gray-500">Apertura: {new Date(enc.periodStart).toLocaleString()}</p>
                    {enc.periodEnd && <p className="text-xs text-gray-400">Cierre: {new Date(enc.periodEnd).toLocaleString()}</p>}
                  </div>
                </div>
                <Badge className={enc.status === 'FINISHED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                  {enc.status}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}

        {/* CONDITIONS */}
        {activeTab === 'conditions' && (
          (!history.conditions || history.conditions.length === 0) ? <p className="text-gray-400 text-sm italic">No hay registros de condiciones patológicas.</p> :
          <div className="grid gap-4 sm:grid-cols-2">
            {history.conditions.map((cond, index) => (
              // Usamos el index porque ConditionDTO en el backend no tiene 'id'
              <Card key={`cond-${index}`} className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900 text-base">{cond.code}</span>
                    <Badge variant="outline" className="text-[10px] uppercase text-gray-400">{cond.clinicalStatus}</Badge>
                  </div>
                  {/* Se reemplazó recordedDate por description, ya que es lo que envía el backend */}
                  <p className="text-sm text-gray-600 mt-2">{cond.description}</p>
                  {cond.encounterId && <p className="text-xs text-gray-400 mt-2">Ref Encounter: #{cond.encounterId}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* OBSERVATIONS */}
        {activeTab === 'observations' && (
          (!history.observations || history.observations.length === 0) ? <p className="text-gray-400 text-sm italic">No existen observaciones registradas.</p> :
          <div className="grid gap-4 sm:grid-cols-3">
            {history.observations.map((obs) => (
              <Card key={obs.id}>
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-600 truncate">{obs.code}</span>
                    <Heart className="h-4 w-4 text-green-500 shrink-0" />
                  </div>
                  <div className="my-1">
                    <span className="text-3xl font-bold text-gray-900">{obs.value}</span>
                    <span className="text-sm font-medium text-gray-500 ml-1">{obs.unit}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-2 block">Toma: {new Date(obs.effectiveDate).toLocaleString()}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* PROCEDURES */}
        {activeTab === 'procedures' && (
          (!history.procedures || history.procedures.length === 0) ? <p className="text-gray-400 text-sm italic">No se registran procedimientos quirúrgicos o de enfermería.</p> :
          history.procedures.map((proc) => (
            <Card key={proc.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">{proc.code}</p>
                  <p className="text-sm text-gray-600">{proc.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Ejecutado: {new Date(proc.performedDate).toLocaleDateString()}</p>
                </div>
                <Badge variant="secondary" className="bg-purple-50 text-purple-700">{proc.status}</Badge>
              </CardContent>
            </Card>
          ))
        )}

        {/* CLINICAL NOTES */}
        {activeTab === 'notes' && (
          (!history.clinicalNotes || history.clinicalNotes.length === 0) ? <p className="text-gray-400 text-sm italic">No se registran notas de evolución médica.</p> :
          history.clinicalNotes.map((note) => (
            <Card key={note.id} className="bg-gray-50/50">
              <CardContent className="p-5 space-y-2">
                <div className="flex justify-between items-center border-b border-gray-200/80 pb-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span>Nota de Evolución • {note.author}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(note.createdAt).toLocaleString()}</span>
                </div>
                {/* Corregido: Llamando a note.content en lugar de note.notes */}
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed mt-2">{note.content}</p>
              </CardContent>
            </Card>
          ))
        )}

      </div>
    </div>
  );
}