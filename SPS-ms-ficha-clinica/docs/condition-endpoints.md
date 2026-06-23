# Condiciones Médicas Endpoints

Endpoints para la gestión de diagnósticos y condiciones médicas del paciente.

## Base URL
`http://localhost:8001/api/v1/conditions`

## Endpoints

### 1. Crear Condición
Registra un nuevo diagnóstico o condición.

- **URL:** `/`
- **Método:** `POST`
- **Body:**
```json
{
  "patientId": "PAT-001",
  "encounterId": "ENC-001",
  "code": "I10",
  "clinicalStatus": "active",
  "description": "Hipertensión esencial"
}
```
- **Respuesta Exitosa:** `200 OK`

---

### 2. Obtener Condición por ID
Obtiene los detalles de una condición específica.

- **URL:** `/{id}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 3. Obtener Condiciones por Paciente
Retorna todas las condiciones actuales de un paciente.

- **URL:** `/patient/{patientId}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 4. Obtener Condiciones por Encuentro
Retorna las condiciones diagnosticadas en un encuentro específico.

- **URL:** `/encounter/{encounterId}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 5. Obtener Historial de Condiciones
Retorna el historial completo de condiciones de un paciente.

- **URL:** `/patient/{patientId}/history`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 6. Eliminar Condición
Elimina una condición del sistema.

- **URL:** `/{id}`
- **Método:** `DELETE`
- **Respuesta Exitosa:** `204 No Content`
