# Procedimientos Endpoints

Endpoints para la gestión de procedimientos médicos realizados a los pacientes.

## Base URL
`http://localhost:8001/api/v1/procedures`

## Endpoints

### 1. Crear Procedimiento
Registra un nuevo procedimiento médico.

- **URL:** `/`
- **Método:** `POST`
- **Body:**
```json
{
  "patientId": "PAT-001",
  "encounterId": "ENC-001",
  "code": "PROC-001",
  "status": "completed",
  "performedDate": "2023-10-27T10:00:00.000Z",
  "description": "Limpieza de herida"
}
```
- **Respuesta Exitosa:** `200 OK`

---

### 2. Obtener Procedimiento por ID
Obtiene los detalles de un procedimiento específico.

- **URL:** `/{id}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 3. Obtener Procedimientos por Paciente
Retorna todos los procedimientos realizados a un paciente.

- **URL:** `/patient/{patientId}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 4. Obtener Procedimientos por Encuentro
Retorna los procedimientos realizados en un encuentro específico.

- **URL:** `/encounter/{encounterId}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 5. Eliminar Procedimiento
Elimina un procedimiento del sistema.

- **URL:** `/{id}`
- **Método:** `DELETE`
- **Respuesta Exitosa:** `204 No Content`
