# Encuentros Médicos Endpoints

Endpoints para la gestión de encuentros (atenciones brindadas) de los pacientes.

## Base URL
`http://localhost:8001/api/v1/encounters`

## Endpoints

### 1. Crear Encuentro
Registra un nuevo encuentro médico.

- **URL:** `/`
- **Método:** `POST`
- **Body:**
```json
{
  "patientId": "PAT-001",
  "locationId": "LOC-001",
  "status": "planned",
  "periodStart": "2023-10-27T10:00:00.000Z",
  "practitioner": "Dr. Smith"
}
```
- **Respuesta Exitosa:** `200 OK`

---

### 2. Obtener Encuentro por ID
Obtiene los detalles de un encuentro específico.

- **URL:** `/{id}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 3. Obtener Encuentros por Paciente
Retorna todos los encuentros asociados a un paciente.

- **URL:** `/patient/{patientId}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 4. Actualizar Estado del Encuentro
Actualiza el estado de un encuentro (ej: planned, in-progress, finished).

- **URL:** `/{id}/status?status={newStatus}`
- **Método:** `PATCH`
- **Respuesta Exitosa:** `200 OK`

---

### 5. Eliminar Encuentro
Elimina un encuentro del sistema.

- **URL:** `/{id}`
- **Método:** `DELETE`
- **Respuesta Exitosa:** `204 No Content`
