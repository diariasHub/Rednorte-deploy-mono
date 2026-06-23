# Notas Clínicas Endpoints

Endpoints para la gestión de notas evolutivas y observaciones narrativas durante la atención.

## Base URL
`http://localhost:8001/api/v1/clinical-notes`

## Endpoints

### 1. Crear Nota Clínica
Registra una nueva nota clínica.

- **URL:** `/`
- **Método:** `POST`
- **Body:**
```json
{
  "patientId": "PAT-001",
  "encounterId": "ENC-001",
  "content": "Paciente presenta evolución favorable...",
  "author": "Dr. Smith"
}
```
- **Respuesta Exitosa:** `200 OK`

---

### 2. Obtener Nota por ID
Obtiene los detalles de una nota específica.

- **URL:** `/{id}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 3. Obtener Notas por Paciente
Retorna todas las notas asociadas a un paciente.

- **URL:** `/patient/{patientId}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 4. Obtener Notas por Encuentro
Retorna las notas registradas en un encuentro específico.

- **URL:** `/encounter/{encounterId}`
- **Método:** `GET`
- **Respuesta Exitosa:** `200 OK`

---

### 5. Eliminar Nota Clínica
Elimina una nota del sistema.

- **URL:** `/{id}`
- **Método:** `DELETE`
- **Respuesta Exitosa:** `204 No Content`
