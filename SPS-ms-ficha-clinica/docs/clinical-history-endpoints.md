# Historia Clínica Endpoints

Endpoints para la consulta consolidada de la historia clínica de un paciente.

## Base URL
`http://localhost:8001/api/v1/history`

## Endpoints

### 1. Obtener Historia Clínica Completa
Retorna toda la información clínica asociada a un paciente, incluyendo encuentros, observaciones, condiciones, procedimientos y notas.

- **URL:** `/patient/{patientId}`
- **Método:** `GET`
- **Descripción:** Consolida toda la información del paciente en un solo objeto.
- **Respuesta Exitosa:** `200 OK`
- **Ejemplo de Respuesta:**
```json
{
  "patientId": "PAT-001",
  "encounters": [...],
  "observations": [...],
  "conditions": [...],
  "procedures": [...],
  "clinicalNotes": [...]
}
```
