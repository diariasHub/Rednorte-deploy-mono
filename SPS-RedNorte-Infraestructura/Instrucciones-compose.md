Guía de Infraestructura: Orquestación de Microservicios RedNorte

En este repositorio no reside código de lógica de negocio, sino las instrucciones para que Docker levante y conecte todas los codigos (Base de Datos, Servidor FHIR y Microservicios).

-------------------------------------------------------------
Requisitos Previos
-----------------------------------------------------------
Docker Desktop instalado y corriendo.

Git configurado.

Haber construido localmente las imágenes de los microservicios que se deseen probar (ej: docker build -t rednorte-ms-agenda:local .).

Crear archivo .ENV con las variables de entorno (estaran en una imagen en drive)
--------------------------------------------------------------------
Comandos Esenciales
Levantar todo el hospital: docker-compose up -d

Ver si todo está corriendo bien: docker-compose ps

Ver logs de un servicio específico (ej. Agenda): docker logs -f rednorte-ms-agenda

Apagar todo el sistema: docker-compose down (Esto no borra los datos de la BD gracias al volumen configurado).
-------------------------------------------------------------
Estructura del Ecosistema

patrón de Base de Datos Compartida y un Servidor FHIR Central.

Base de Datos: PostgreSQL (Puerto 5432).

Capa Clínica: HAPI FHIR Server (Puerto 8080).

Microservicios: Se conectan internamente al servidor FHIR para persistir datos.
-----------------------------------------------------------------------
Cómo Agregar un Nuevo Microservicio

Para escalar la arquitectura y añadir un nuevo servicio al docker-compose.yml, sigue esta guia

1. Perfil del Servicio (Nombre e Imagen)
Copia un bloque existente y cambia el nombre del servicio.

YAML
---------------------------------------------------------
nuevo-microservicio:
  image: rednorte-nuevo-ms:local # Nombre de la imagen que construiste
  container_name: rednorte-nuevo-ms
----------------------------------------------------------
2. Puertos (Evitar Conflictos)
El puerto interno siempre será 8080 (Spring Boot), pero el puerto externo (host) debe ser único.

Rango sugerido: 8081 (Usuarios), 8082 (Agenda), 8083 (Reservas), etc.
------------------------------------------------------------
YAML
  ports:
    - "808X:8080" 
------------------------------------------------------------
3. Parámetros (Variables de Entorno)
Todos los microservicios deben conocer la ubicación del servidor FHIR para funcionar. Gracias a la red interna de Docker, la URL es siempre la misma:

YAML
  environment:
    - FHIR_SERVER_URL=http://hapi-fhir:8080/fhir
  networks:
    - rednorte-network
  depends_on:
    - hapi-fhir

---------------------------------------------------------
esto es para hacer las pruebas en local posteriormente con el DOCKER-COMPOSE con todos los microservicios agregados se levanta en la instancia EC2  se ejecuta y este llama y levanta los microservicios que nesecita. 