# CRUD Observations API

Endpoints para la gestión de Observaciones (Signos Vitales, Resultados de Laboratorio, etc.) en la Ficha Clínica.

## Base URL
`http://localhost:8001/api/v1/observations`

## Endpoints

### 1. Crear Observación
Crea una nueva observación para un paciente.

- **URL:** `/`
- **Método:** `POST`
- **Body:**
```json
{
  "patientId": "PAT-001",
  "encounterId": "ENC-001",
  "code": "8480-6",
  "value": 120.0,
  "unit": "mmHg",
  "effectiveDate": "2023-10-27T10:00:00.000Z"
}
```
- **Respuesta Exitosa:** `201 Created`

---

### 2. Obtener Todas las Observaciones
Retorna una lista de todas las observaciones registradas.

- **URL:** `/`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 3. Obtener Observación por ID
Obtiene los detalles de una observación específica.

- **URL:** `/{id}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 4. Obtener Historial de Observaciones por Paciente
Retorna todas las observaciones asociadas a un paciente específico.

- **URL:** `/patient/{patientId}/history`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 5. Obtener Observaciones por Encuentro
Retorna todas las observaciones registradas en un encuentro médico específico.

- **URL:** `/encounter/{encounterId}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 6. Actualizar Observación
Actualiza los datos de una observación existente.

- **URL:** `/{id}`
- **Método:** `PUT`
- **Body:**
```json
{
  "patientId": "PAT-001",
  "encounterId": "ENC-001",
  "code": "8480-6",
  "value": 125.0,
  "unit": "mmHg",
  "effectiveDate": "2023-10-27T11:00:00.000Z"
}
```
- **Respuesta Exitosa:** `200 OK`

---

### 7. Eliminar Observación
Elimina una observación del sistema.

- **URL:** `/{id}`
- **Método:** `DELETE`
- **Respuesta Exitosa:** `204 No Content`
