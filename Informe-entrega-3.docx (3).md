## **Informe - Integración de Arquitectura de Microservicios** 

**Asignatura:** DSY1106 – Desarrollo Fullstack III 

**Evaluación:** Parcial N°3 – Integración de arquitectura de microservicios **Integrantes:** 

- Raul Olguin 

- Diego Arias 

- Manuel Caceres 

- Cristopher Osses 

**Sección:** 003V 

**Docente:** Bryan Soto **Fecha de entrega:** _22_ / _06_ / _2026_ 

**1. Introducción................................................................................................................3 2. Objetivos..................................................................................................................... 3** 2.1. Objetivo general..............................................................................................................................3 2.2. Objetivos específicos......................................................................................................................4 **3. Descripción del problema y propuesta de solución......................................................4** 3.1. Problema abordado........................................................................................................................4 3.2. Propuesta de solución....................................................................................................................5 **4. Arquitectura de microservicios................................................................................... 6** 4.1. Diagrama de arquitectura.............................................................................................................. 6 4.2. Componentes de la arquitectura....................................................................................................6 4.3. Justificación técnica.....................................................................................................................10 **5. Tecnologías utilizadas................................................................................................12** 5.1. Frontend........................................................................................................................................12 5.2. Backend.........................................................................................................................................13 5.3. Persistencia y soporte...................................................................................................................14 **6. Integración frontend y backend................................................................................. 15** 6.1. Flujo general................................................................................................................................. 15 6.2. Ejemplo de integración................................................................................................................ 16 **7. Persistencia de datos..................................................................................................17** 7.1. Estrategia de persistencia............................................................................................................. 17 7.2. Modelo de datos............................................................................................................................17 7.3. Flujo de persistencia.....................................................................................................................18 7.4. Seguridad y consistencia.............................................................................................................. 19 **8. API REST................................................................................................................... 19** 8.1. Endpoints principales..................................................................................................................20 8.2. Ejemplo de request......................................................................................................................20 8.3. Ejemplo de response....................................................................................................................20 **9. Pruebas unitarias.....................................................................................................................21** 9.1. Estrategia de pruebas....................................................................................................... 21 9.2. Herramientas utilizadas.....................................................................................................22 9.3. Métricas de cobertura....................................................................................................... 22 9.4. Integración de pruebas de API (Postman)........................................................................ 23 9.5. Evidencias.........................................................................................................................24 9.6. Relación con patrones de diseño......................................................................................27 **10. Organización de repositorios............................................................................................... 27 11. Conclusión..............................................................................................................................28** 

Este documento base está estructurado para desarrollar el informe solicitado en la Evaluación Parcial N°3. La pauta exige documentar la arquitectura de microservicios, explicar la persistencia de datos, incluir un informe de pruebas unitarias con métricas claras, versionar los componentes en GitHub y entregar los componentes empaquetados junto con su documentación . 

## **1. Introducción** 

El presente informe describe la propuesta, implementación e integración de una arquitectura de microservicios desarrollada para responder a los requerimientos del caso planteado para la empresa de salud RedNorte. La solución considera la separación de responsabilidades entre componentes frontend y backend, la comunicación mediante API REST, el uso de mecanismos de persistencia y la incorporación de pruebas unitarias para resguardar la calidad del sistema . 

## **2. Objetivos** 

## **2.1. Objetivo general** 

Diseñar e implementar una solución basada en arquitectura de microservicios que permita integrar componentes frontend y backend, asegurar la persistencia de datos y validar la calidad del sistema mediante pruebas unitarias, esto con la meta de poder realizar una gestión completa dentro del area de salud y buscar una solución para la congestión en las salas de espera del hospital RedNorte. 

## **2.2. Objetivos específicos** 

- **Diseñar la arquitectura de microservicios del sistema:** Definir e implementar una arquitectura distribuida que incluya al menos dos microservicios de dominio (por ejemplo, gestión de usuarios y pacientes) y un componente BFF (Backend For Frontend) que centralice y adapte las respuestas para la interfaz de usuario. 

- **Integrar los componentes del sistema mediante API REST:** Construir y habilitar la comunicación bidireccional entre el frontend, el BFF y los microservicios backend utilizando servicios RESTful, asegurando un intercambio de datos estandarizado y funcional. 

- **Implementar el modelo de persistencia de datos:** Diseñar e integrar una capa de persistencia en los microservicios utilizando JPA (Java Persistence API), garantizando la correcta lectura, escritura y almacenamiento de la información del dominio en la base de datos relacional. 

- **Asegurar la calidad del código mediante pruebas automatizadas:** Desarrollar y ejecutar un conjunto de pruebas unitarias para los componentes críticos del sistema, alcanzando y documentando una cobertura mínima del 60% en todos los módulos evaluados. 

- **Gestionar las versiones y despliegue del código fuente:** Organizar la estructura del proyecto en repositorios de control de versiones (GitHub), manteniendo el código fuente accesible, centralizado y actualizado para respaldar el ciclo de vida del desarrollo. 

## **3. Descripción del problema y propuesta** 

## **de solución** 

## **3.1. Problema abordado** 

En el sector de la salud, las instituciones médicas y redes asistenciales frecuentemente enfrentan problemas de fragmentación de la información, sistemas monolíticos obsoletos y falta de interoperabilidad. Actualmente, la gestión de datos clínicos (como la ficha del paciente), la administración del personal médico, el flujo de atención en urgencias y el agendamiento operan a menudo como islas de información. Esto genera múltiples problemas: 

- **Tiempos de respuesta lentos y redundancia:** El personal clínico debe buscar o reingresar datos del paciente en distintos sistemas, retrasando la atención, especialmente en contextos críticos como urgencias. 

- **Falta de estandarización:** La ausencia de protocolos estándar dificulta compartir el historial clínico de un paciente entre distintos centros de una misma red de salud de forma segura. 

- **Escalabilidad y mantenimiento limitados:** Los sistemas tradicionales cerrados (monolitos) son difíciles de actualizar, mantener y escalar ante el aumento de la demanda de pacientes o la necesidad de integrar nuevas funcionalidades (como autenticación de doble factor o nuevos módulos de atención). 

## **3.2. Propuesta de solución** 

Para resolver esta problemática, se propone el desarrollo del sistema RedNorte, una plataforma de gestión hospitalaria y asistencial moderna, modular y escalable. La solución se basa en una arquitectura de microservicios que permite desacoplar los dominios principales del negocio clínico, integrando un frontend optimizado a través de un patrón BFF (Backend For Frontend). 

## **● Las características clave de la propuesta incluyen:** 

- **Arquitectura Distribuida y Resiliente:** Separación de responsabilidades en microservicios independientes (gestión de pacientes, gestión de usuarios/roles, flujo de urgencias, agenda y ficha clínica), orquestados a través de un API Gateway y Service Discovery. 

- **Interoperabilidad Clínica:** Adopción del estándar internacional HL7 FHIR para estructurar y gestionar los recursos clínicos de los pacientes, asegurando que la información sea compatible y fácilmente intercambiable. 

- **Seguridad y Control de Acceso Centralizado:** Implementación de un microservicio de identidad (ms-login-user) basado en tokens JWT y roles, que garantiza que solo personal autorizado (ej. médicos, enfermeras, administradores) tenga acceso a datos sensibles según su perfil. 

- **Integración API REST y Persistencia Confiable:** Exposición de operaciones estandarizadas a través de APIs documentadas (OpenAPI/Swagger) y persistencia de datos relacional robusta (vía Spring Data JPA y PostgreSQL) para garantizar la integridad y trazabilidad del historial médico. 

## **4. Arquitectura de microservicios** 

## **4.1. Diagrama de arquitectura** 

## **4.2. Componentes de la arquitectura** 

Describir cada componente: 

## ● **Frontend:** 

- **Framework utilizado:** Desarrollado utilizando React.js (junto con Next.js para renderizado optimizado y enrutamiento). 

- **Función principal:** Es la interfaz de usuario (UI) principal con la que interactúa el personal clínico y administrativo del hospital. Su propósito es consumir los datos expuestos por el backend y presentarlos de forma amigable e interactiva. 

- **Módulos relevantes:** Incluye vistas para el inicio de sesión (Login/Auth), paneles de administración de personal (CRUD de usuarios), y vistas clínicas operativas 

como el buscador/registro de pacientes y la visualización de fichas y agendas médicas. 

- **BFF:** 

   - **Responsabilidad:** Actúa como el único punto de entrada para las peticiones del frontend (ms-api-gateway). Su función principal es enrutar las solicitudes del cliente hacia los microservicios correspondientes, ocultando la complejidad de la arquitectura distribuida. También sirve para resolver problemas de CORS y consolidar la seguridad perimetral. 

   - **Rutas expuestas y lógica de orquestación:** Expone rutas abstractas (ej. /api/pacientes/**, /api/usuarios/**, /auth/**). Internamente interactúa con el componente de Service Discovery (Eureka) para conocer dinámicamente las IPs y puertos de los microservicios vivos, orquestando y redirigiendo el tráfico sin que el frontend necesite conocer la topología de la red interna. 

- **Microservicio 1: Gestion de usuarios(ms-usuarios y ms-login-user)** 

   - **Dominio funcional:** Centraliza la administración de identidades, autenticación y control de acceso del sistema (IAM). Se encarga de gestionar a los profesionales de salud, administradores y cuentas de integración. 

## **○ Operaciones principales:** 

      - Emisión y validación de tokens JWT (/auth/login). 

      - Gestión de roles y permisos (ej. MEDICO_URGENCIA, ADMIN). 

      - Manejo de factores de doble autenticación (MFA/OTP). 

      - Operaciones CRUD de usuarios para el panel de administración. 

   - **Acceso a datos:** Persiste la información a través de Spring Data JPA. Define entidades Java (ej. User, Role) mapeadas a tablas relacionales, exponiendo repositorios (UserRepository, RoleRepository) para consultas transaccionales. 

- **Microservicio 2: Gestión de pacientes(ms-paciente)** 

   - **Dominio funcional:** Es el módulo core clínico (Core Health Domain). Administra la información demográfica, contactos y registros identificatorios de los pacientes de la red de salud. 

## **○ Operaciones principales:** 

- Búsqueda, creación y actualización de pacientes (/api/v1/patients/**). 

- Manejo y vinculación de recursos clínicos utilizando el estándar internacional de interoperabilidad HL7 FHIR. 

- Validación de seguridad JWT delegada (valida que el solicitante tenga un token emitido por el microservicio de login). 

- **Acceso a datos:** Utiliza JPA para sus operaciones CRUD internas, pero además se integra directamente con un servidor externo HAPI FHIR Server 

   - (http://hapi-fhir:8080/fhir) para almacenar de forma estandarizada los recursos clínicos de los pacientes, actuando como un puente entre la base de datos relacional y el estándar médico. 

## **● Microservicio 3: Red de centros(ms-red-centros)** 

- **Dominio funcional:** Administra la infraestructura física y organizativa de la red de salud. Se encarga de gestionar hospitales, clínicas, sucursales y la estructura interna de los mismos (pisos, pabellones, boxes de atención). 

## **○ Operaciones principales:** 

   - Búsqueda y listado de centros de atención disponibles. 

   - CRUD de ubicaciones e infraestructura clínica. 

   - Sincronización de estructuras hospitalarias utilizando recursos estandarizados (como Organization y Location en HL7 FHIR). 

- **Acceso a datos:** Utiliza Spring Data JPA conectado a PostgreSQL para la persistencia del catálogo interno de centros, y expone repositorios para consultas transaccionales de ubicaciones. 

## **● Microservicio 4: Agenda profesional (ms-agenda / ms-agenda-profesional)** 

- **Dominio funcional:** Controla la disponibilidad de tiempo de los profesionales médicos. Es el motor detrás de la asignación de citas, bloques horarios y planificación de turnos del personal clínico. 

## **○ Operaciones principales:** 

   - Creación de bloques de disponibilidad (agendas) para médicos. 

   - Reserva, cancelación y modificación de citas (agendamiento de pacientes). 

   - Cruce de disponibilidad entre la ubicación (box médico del ms-red-centros) y el profesional. 

- **Acceso a datos:** Patrón Repository vía JPA/Hibernate. Las tablas principales gestionan relaciones de tiempo (inicio/fin), estado de la reserva (disponible, reservado, asistido) y llaves foráneas lógicas hacia los IDs de pacientes y médicos. 

## **● Microservicio 5: Ficha clínica(ms-ficha-clinica)** 

- **Dominio funcional:** Es el repositorio del historial médico del paciente. Centraliza diagnósticos, alergias, evoluciones médicas, recetas y notas clínicas de atenciones pasadas. 

## **○ Operaciones principales:** 

   - Creación y lectura de evoluciones médicas (notas de progreso). 

   - Registro de signos vitales, diagnósticos y tratamientos. 

   - Lectura consolidada del historial clínico de un paciente específico. 

- **Acceso a datos:** Motor de persistencia en PostgreSQL (configurado explícitamente en su perfil). Maneja tablas críticas orientadas al registro de datos inmutables o versionados (para auditoría médica) mediante entidades JPA. Su estrategia de acceso requiere alta lectura y validación estricta de seguridad (JWT) por el nivel de sensibilidad de los datos. 

## **● Microservicio 6: Flujo de urgencias(ms-flujo-urgencias)** 

- **Dominio funcional:** Controla el ciclo de vida de un paciente desde que ingresa por la puerta de urgencias hasta que es dado de alta o derivado. Maneja estados en tiempo real y priorización. 

## **○ Operaciones principales:** 

      - Admisión del paciente al servicio de urgencia. 

      - Clasificación de riesgo clínico (Triage / Categorización). 

      - Actualización de estados del paciente en tránsito (en sala de espera, en box, en observación, alta médica). 

- **Acceso a datos:** Persistencia relacional mediante JPA enfocada en transacciones 

   - rápidas. Las tablas principales modelan "Eventos" o "Episodios" de atención y "Triage", requiriendo consultas optimizadas para los dashboards de urgencia 

(pantallas en tiempo real de pacientes en espera). 

## ● **Persistencia:** 

- Motor de base de datos: El almacenamiento principal en los entornos de producción/staging es PostgreSQL (configurado a través del archivo docker-compose.yml), mientras que para pruebas o perfiles dev utiliza bases de datos en memoria (H2). 

## **○ Tablas principales:** 

   - **En el dominio de usuarios:** Tablas como users (id, username, password, email, active), roles (id, name, description) y tablas intermedias user_roles. 

   - **En el dominio de pacientes:** Tablas para datos demográficos y cruces con identificadores FHIR (patients, patient_contacts). 

- **Estrategia de acceso:** El sistema implementa la persistencia utilizando el estándar JPA (Java Persistence API) a través del proveedor Hibernate. Se utiliza el patrón Repository (Spring Data Repositories) para abstraer el código SQL, utilizando sentencias generadas dinámicamente y consultas JPQL o Criteria API para las búsquedas complejas. El diseño incluye validación de esquemas al iniciar (ddl-auto: validate/update) asegurando que el código y la base de datos estén siempre sincronizados. 

## **4.3. Justificación técnica** 

La definición arquitectónica del sistema RedNorte se fundamenta en garantizar escalabilidad, mantenibilidad, interoperabilidad y alta disponibilidad en un entorno crítico como lo es el sector de la salud. A continuación, se justifican las principales decisiones técnicas adoptadas: 

## **1. Adopción del Patrón de Microservicios** 

Se descartó el enfoque monolítico tradicional en favor de una arquitectura orientada a microservicios. Esta separación por dominios de negocio (Pacientes, Usuarios, Urgencias, Agenda, etc.) permite: 

**Escalamiento independiente:** Si el módulo de Urgencias sufre picos de demanda durante una crisis sanitaria, este microservicio puede escalar en hardware de forma independiente sin necesidad de replicar todo el sistema. 

**Aislamiento de fallos:** Si un servicio secundario (ej. Agenda) experimenta una caída, el resto del ecosistema (ej. Fichas Clínicas y Urgencias) sigue operando ininterrumpidamente, lo cual es de riesgo vital en salud. 

**Despliegue ágil:** Permite que distintos equipos trabajen, actualicen y desplieguen funcionalidades (ej. mediante contenedores Docker) sin afectar a otros módulos. 

## **2. Patrón BFF (Backend For Frontend) y API Gateway** 

La inclusión de un API Gateway actuando como BFF resuelve la fricción entre la topología de red de los microservicios y las necesidades de la interfaz de usuario: 

**Orquestación y consolidación:** El frontend no necesita conocer las IPs ni los puertos de los múltiples microservicios subyacentes. El Gateway enruta dinámicamente las peticiones, reduciendo la latencia de red y acoplando las respuestas. 

**Seguridad perimetral:** Permite centralizar políticas globales, como la validación de dominios permitidos (CORS) y prevenir la exposición directa de la infraestructura interna de los microservicios hacia internet. 

## **3. Seguridad Stateless mediante JWT (JSON Web Tokens)** 

El manejo de sesiones tradicionales penaliza el rendimiento en ecosistemas distribuidos. Se optó por JWT gestionado por el microservicio de autenticación (ms-login-user): 

**Descentralización:** Los tokens emitidos contienen las credenciales y roles del usuario firmados criptográficamente. Cualquier otro microservicio (como Pacientes o Ficha Clínica) puede validar el token de forma local utilizando la llave pública (JWKS) sin necesidad de consultar permanentemente a la base de datos o al servidor de autenticación, mejorando dramáticamente el tiempo de respuesta. 

## **4. Persistencia Relacional con PostgreSQL y Spring Data JPA** 

**Integridad y consistencia:** El historial clínico y los datos demográficos son registros críticos y altamente estructurados. PostgreSQL garantiza el cumplimiento de las propiedades ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad) para evitar corrupciones de datos (ej. agendar un paciente en un horario ya ocupado). 

**Abstracción mediante JPA (Hibernate):** El uso de Spring Data JPA protege el sistema contra ataques de Inyección SQL y aumenta la velocidad de desarrollo al automatizar el mapeo objeto-relacional (ORM), facilitando futuras migraciones si se requiriera cambiar el motor de base de datos base (como de H2 en desarrollo a PostgreSQL en producción). 

## **5. Interoperabilidad Clínica mediante HL7 FHIR** 

A diferencia de sistemas cerrados comerciales, la arquitectura incluye conectividad directa a un servidor HAPI FHIR: 

**Estándar Internacional:** La información no se almacena en esquemas propietarios, sino modelada bajo los estándares HL7 FHIR (ej. recursos Patient, Observation, Encounter). Esto prepara a RedNorte tecnológica y legalmente para integrarse fácilmente con otras redes hospitalarias gubernamentales, laboratorios externos o sistemas de facturación en el futuro. 

## **6. Frontend Desacoplado con React/Next.js** 

El uso de una interfaz basada en componentes independientes a través de React optimiza la experiencia de usuario (UX): 

**Reactividad en tiempo real:** Crucial para los monitores y flujos de Urgencia donde la pantalla debe actualizarse asíncronamente sin recargar el navegador. 

**Rendimiento:** Al estar desacoplado del backend, el servidor solo transfiere datos ligeros en formato JSON, disminuyendo el ancho de banda consumido en los equipos de los recintos hospitalarios. 

## **5. Tecnologías utilizadas** 

## **5.1. Frontend** 

Indicar framework, librerías, herramientas de construcción y testing. 

|Tecnología|Categoría|Uso en el proyecto|
|---|---|---|
|React.js / Next.js|Framework|Construcción de las interfaces de usuario interactivas,<br>renderizado optimizado y enrutamiento estructurado de<br>la aplicación web.|
|Vanilla CSS|Libreria de UI|Construcción de componentes, estilos globales y manejo<br>de la estética (colores, alertas, animaciones).|
|Axios/Fetch API|Librerias de Red|Consumo de la API REST expuesta por el Backend y<br>manejo de interceptores para el envío de tokens JWT.|
|Node.js/npm|Entorno y paquetes|Gestión de dependencias de frontend y ejecución del<br>servidor de desarrollo.|
|Jest/ React  Testing|Testing|Ejecución de pruebas unitarias sobre los componentes<br>de la interfaz de usuario para garantizar su correcto<br>renderizado y lógica.|



## **5.2. Backend** 

Indicar lenguaje, framework y dependencias relevantes. 

|Tecnología|Categoría|Uso en el proyecto|
|---|---|---|
|JAVA(JDK 21)|Lenguaje|Lenguaje base orientado a objetos<br>utilizado para el desarrollo de la<br>lógica de negocio de toda la<br>arquitectura de microservicios.|
|Spring Boot 3.4.0|Framework core|Base fundamental que provee<br>auto-configuración y embebe el<br>servidor web (Tomcat) para levantar<br>los microservicios de manera<br>autónoma e independiente.|
|Spring Cloud Gateway|Enrutamiento BFF|Utilizado en ms-api-gateway para<br>orquestar y enrutar las peticiones<br>entrantes desde el frontend hacia el<br>microservicio interno<br>correspondiente.|
|Spring Cloud Netflix Eureka|Service Discovery|Utilizado en el servidor de<br>descubrimiento para que los<br>microservicios se registren<br>dinámicamente y se localicen entre sí<br>mediante nombres y no por IP fija.|
|Spring Security /OAuth2|Seguridad|Manejo integral de la seguridad:<br>emisión de tokens JWT<br>(ms-login-user) y configuración de los<br>Resource Servers para validar<br>tokens y restringir rutas por roles.|
|HAPI FHIR|Interoperabilidad|Librería especializada implementada<br>para estructurar y consumir datos de<br>salud bajo el estándar internacional<br>HL7 FHIR (específicamente R4).|
|SpringDoc OpenAPI v3|Documentación|Generación automática de la<br>documentación interactiva de las<br>APIs (Swagger UI) y exposición de<br>los esquemas .yaml de cada<br>microservicio.|



|Lombok|Herramienta|Reducción de código repetitivo<br>(boilerplate) en entidades y DTOs,<br>autogenerando getters, setters,<br>constructores y constructores<br>(builders).|
|---|---|---|
|Maven|Construcción (Build)|Gestión del ciclo de vida del<br>proyecto, resolución de<br>dependencias, compilación,<br>ejecución de tests y empaquetado<br>final en archivos .jar.|
|JUnit 5 / Mockito|Testing|Herramientas principales para la<br>ejecución de pruebas unitarias y<br>creación de mocks para garantizar el<br>porcentaje de cobertura de código<br>exigido.|



## **5.3. Persistencia y soporte** 

|Tecnología|Categoría|Uso en el proyecto|
|---|---|---|
|PostgreSQL|Motor de base de datos|Base de datos relacional principal utilizada en los entornos<br>estables (prod) para almacenar información transaccional crítica y<br>persistente.|
|H2 Database|Base de datos(Memoria<br>para entorno de pruebas)|Utilizado bajo el perfil dev para levantar bases de datos volátiles y<br>ultrarrápidas, agilizando el desarrollo local y la ejecución de tests.|
|Spring Data JPA /<br>Hibernate|ORM(Persistencia)|Capa de abstracción que mapea los objetos Java a tablas<br>relacionales de la base de datos, evitando escribir código SQL<br>directo para el CRUD básico.|
|Docker engine|Contenedorización|Creación de imágenes aisladas (Dockerfile) de cada microservicio<br>empaquetado junto con su entorno de ejecución Java (JRE).|
|Docker compose|Orquestación local|Herramienta (docker-compose.yml) que centraliza, enlaza y<br>levanta toda la red de microservicios, bases de datos e<br>infraestructura con un solo comando.|
|Git/Github|Control de versiones|Seguimiento de los cambios en el código fuente, organización<br>mediante repositorios accesibles y trabajo colaborativo.|



## **6. Integración frontend y backend** 

La arquitectura del ecosistema RedNorte garantiza una integración robusta entre las interfaces de usuario y los servicios de datos mediante el uso exclusivo de APIs RESTful bajo el formato JSON. El sistema asegura una comunicación efectiva, centralizada y segura gracias a la inclusión de un BFF (Backend For Frontend) / API Gateway, evitando que el cliente interactúe directamente con las bases de datos o conozca la topología de red interna. 

El frontend asume la responsabilidad de la presentación e interactividad, mientras que los microservicios encapsulan la lógica de negocio clínica, delegando la persistencia a motores relacionales (PostgreSQL) mediante un ORM (Spring Data JPA). 

## **6.1. Flujo general** 

El ciclo de vida estándar de una solicitud dentro de la arquitectura se compone de los siguientes pasos: 

- **Interacción:** El usuario interactúa con la interfaz del Frontend (aplicación React/Next.js) realizando una acción, como por ejemplo, buscar el expediente de un paciente o iniciar sesión. 

- **Petición Perimetral:** El Frontend intercepta la acción y envía una solicitud HTTP (adjuntando el token JWT si corresponde) hacia el BFF / API Gateway (expuesto en el puerto 8080). 

- **Orquestación y Enrutamiento:** El BFF recibe la petición, resuelve dinámicamente la ubicación del microservicio destino (vía Eureka Service Discovery) y deriva la solicitud (ej. hacia ms-paciente o ms-usuarios). 

- **Ejecución y Persistencia:** El microservicio destino valida los permisos de seguridad (desencriptando el token JWT), ejecuta la lógica de negocio correspondiente e interactúa con la capa de persistencia (vía sentencias autogeneradas por JPA) hacia la base de datos PostgreSQL o el servidor FHIR. 

- **Retorno:** La base de datos responde al microservicio, este serializa el resultado en un DTO (Data Transfer Object) formato JSON, lo devuelve al BFF, y el BFF retorna la respuesta consolidada al Frontend para que actualice la interfaz gráfica (renderizado visual). 

## **6.2. Ejemplo de integración** 

A continuación se detalla un flujo de trazabilidad completo que demuestra cómo los componentes colaboran para satisfacer el requerimiento de negocio de consultar a un paciente: 

|Componente origen|Endpoint o acción|Resultado|
|---|---|---|
|Frontend (React)|POST /api/auth/login|El frontend envía credenciales. El BFF<br>enruta la petición hacia el servicio de<br>identidad.|
|BFF (API Gateway)|POST /auth/login.|Valida credenciales, genera el Access<br>Token JWT firmado criptográficamente y<br>lo devuelve al frontend.|
|Frontend (React)|GET /api/v1/patients/123<br>(Header<br>: Bearer<br>Token)|El frontend solicita los datos del<br>paciente adjuntando la credencial de<br>seguridad.|
|BFF (API Gateway)|GET /api/v1/patients/123|El BFF enruta la llamada hacia la<br>instancia viva del microservicio de<br>pacientes.|
|Microservicio 2<br>(ms-paciente)|Consulta JPA<br>findById<br>(123)|El motor ejecuta la consulta SQL<br>transaccional y devuelve la fila<br>correspondiente al paciente.|
|Microservicio 2|Retorno JSON|Los datos crudos se envían<br>estructurados al cliente web, donde el<br>frontend pinta la vista del historial clínico<br>en pantalla.|



## **7. Persistencia de datos** 

Para garantizar la integridad, escalabilidad y mantenibilidad de la información hospitalaria, el proyecto adopta una estrategia de persistencia relacional estandarizada, orquestada a través de frameworks de alto nivel que abstraen la complejidad del código SQL directo. 

## **7.1. Estrategia de persistencia** 

Se utilizó Spring Data JPA soportado por Hibernate como proveedor de ORM (Object-Relational Mapping). La estrategia se basa estructuralmente en el uso de Repositorios (Patrón Repository). En lugar de crear procedimientos almacenados rígidos en la base de datos o redactar consultas nativas acopladas al motor, JPA permite mapear clases de Java (@Entity) directamente a tablas. Los repositorios (interfaces que extienden de JpaRepository) proveen métodos autogenerados para operaciones CRUD e integran un intérprete JPQL para consultas de negocio complejas. El motor de base de datos transaccional definido para los perfiles de producción es PostgreSQL, mientras que para desarrollo se utiliza H2 Database garantizando un arranque ágil. Además, para el dominio clínico estricto (pacientes), la persistencia relacional se complementa con el almacenamiento interoperable en un Servidor HAPI FHIR. 

## **7.2. Modelo de datos** 

El modelo de datos se encuentra distribuido acorde a la arquitectura de microservicios (Database-per-Service). Sus entidades y tablas principales son: 

## **Microservicio de Usuarios (ms-login-user / ms-usuarios):** 

users: Tabla central de identidades. Almacena identificadores, correos y contraseñas encriptadas (BCrypt). 

roles: Define los perfiles de sistema (ej. MEDICO_URGENCIA, ADMIN). 

user_roles: Tabla intermedia que mapea la relación Muchos-a-Muchos (N:M) entre usuarios y roles. 

## **Microservicio de Pacientes (ms-paciente):** 

patients: Registra los datos demográficos básicos y de contacto heredado (sistema legado). 

Relación conceptual (sin llave foránea directa de DB) hacia el servidor FHIR externo, donde se almacenan recursos estructurados tipo Patient y Encounter. 

## **Microservicio de Agenda (ms-agenda):** 

agendas y citas: Relacionan temporalmente (M:1) un profesional (referencia al ID de usuario) con un paciente (referencia al ID de paciente). 

## **7.3. Flujo de persistencia** 

El viaje de un dato desde que se emite en la interfaz hasta que se asienta en la base de datos (por ejemplo, el registro de un nuevo paciente) ocurre así: 

- **Captura en Interfaz:** El usuario completa un formulario en el Frontend (React). Los datos se agrupan en un objeto JSON. 

- **Transferencia e Ingreso:** El JSON viaja vía POST al BFF y luego al controlador REST (Controller) del microservicio destino, mapeándose automáticamente a un objeto de transferencia (DTO). 

- **Validación Inicial:** Anotaciones de validación (ej. @NotBlank, @Email, @Valid de jakarta.validation) evalúan la integridad estructural del DTO antes de tocar la lógica. Si falla, se corta el flujo devolviendo un error HTTP 400. 

- **Reglas de Negocio:** El Service recibe el DTO validado, aplica lógica de negocio (ej. verificar que no exista un paciente con el mismo RUT) y mapea el DTO hacia una Entity de JPA. 

- **Ejecución de la Persistencia:** El Service invoca al método save() del repositorio. Hibernate traduce el objeto a una sentencia INSERT/UPDATE nativa para PostgreSQL. 

- **Confirmación:** Si la operación es exitosa en el motor, retorna un objeto con el ID autogenerado. El controlador devuelve un estado HTTP 201 Created al frontend para notificar al usuario final. 

## **7.4. Seguridad y consistencia** 

Para fortalecer la seguridad y la fiabilidad técnica del sistema, se implementan las siguientes consideraciones a nivel de persistencia y lógica: 

- **Control de Transacciones:** Las operaciones de escritura en los servicios están anotadas con @Transactional. Esto asegura las propiedades ACID; si una operación compuesta falla a la mitad, se ejecuta un rollback automático impidiendo datos huérfanos o inconsistentes. 

- **Restricciones de Integridad:** El esquema de base de datos (validado automáticamente por JPA al iniciar mediante ddl-auto: validate) define restricciones lógicas fundamentales como llaves primarias, UNIQUE constraints (para correos/RUTs) y atributos NOT NULL. 

- **Manejo de Errores Global:** Implementación de controladores de consejos (@ControllerAdvice o GlobalExceptionHandler) que capturan excepciones de base de datos (como violaciones de llaves foráneas o integridad), transformándolas en mensajes legibles y seguros (ocultando el stack trace SQL al cliente). 

- **Autenticación y Autorización en Capas:** A nivel de controladores y servicios, las etiquetas @PreAuthorize("hasRole('...')") aseguran que ningún usuario (por más que conozca el endpoint del API) pueda alterar los datos o persistir información si su token JWT no posee el rol explícitamente autorizado. 

## **8. API REST** 

El ecosistema RedNorte expone sus operaciones mediante servicios RESTful documentados automáticamente a través de la especificación OpenAPI (Swagger). Esto facilita la integración del frontend y de futuros sistemas externos, estandarizando los verbos HTTP y los códigos de respuesta. 

A continuación, se describen los endpoints principales del módulo de Gestión de Pacientes (ms-paciente) para ilustrar el comportamiento transaccional del sistema: 

## **8.1. Endpoints principales** 

|Método|Endpoint|Descripción|Código esperado|
|---|---|---|---|
|GET|/api/v1/patients/{id}|Obtener la información demográfica e<br>identificadores de un paciente<br>específico registrado en el sistema.|200 OK<br>404 Not found|
|POST|/api/v1/patients|Crear e ingresar un nuevo paciente a la<br>base de datos de la red de salud.|201 Created<br>400 Bad request|
|PUT|/api/v1/patients/{id}|Actualizar de forma completa la<br>información de un paciente existente<br>(ej. cambio de domicilio o nombre).|200 OK|
|DELETE|/api/v1/patients/{id}|Inactivar o marcar como eliminado a un<br>paciente del sistema (eliminación lógica<br>por seguridad clínica).|204 No Content|



## **8.2. Ejemplo de request** 

{ 

"run": "18123456-7", 

"nombres": "Juan Alberto", 

"apellidoPaterno": "Pérez", "apellidoMaterno": "González", "fechaNacimiento": "1990-05-15", "genero": "MASCULINO", "telefonoContacto": "+56912345678", 

"direccion": "Avenida Siempre Viva 123, Antofagasta" 

} 

## **8.3. Ejemplo de response** 

"id": 105, 

"mensaje": "Paciente registrado exitosamente.", 

"timestamp": "2026-06-22T10:15:30.123Z", 

"datosGenerados": { "run": "18123456-7", "estado": "ACTIVO", "fechaRegistro": "2026-06-22" } } 

## **9. Pruebas unitarias** 

Para garantizar la estabilidad del sistema RedNorte y evitar regresiones durante el ciclo de desarrollo continuo, se diseñó e implementó una estrategia integral de pruebas automatizadas. Esta estrategia cubre de forma piramidal tanto la lógica aislada del código (pruebas unitarias) como la validación de contratos de red (pruebas de integración de API). 

## **9.1. Estrategia de pruebas** 

La estrategia de pruebas unitarias se enfocó en validar el comportamiento atómico de las clases con mayor responsabilidad de negocio, específicamente las capas de Servicio (@Service) y de Controladores (@RestController). Los repositorios y la base de datos se aislaron mediante el uso de "Mocks", asegurando que las pruebas se ejecuten de manera determinista y rápida sin depender de infraestructura externa (como PostgreSQL o FHIR). El criterio para definir los casos de prueba se basó en el flujo Given-When-Then (Dado un estado inicial, cuando ocurre una acción, entonces se espera un resultado específico), priorizando los caminos felices (código 200/201) y el manejo de excepciones de negocio (códigos 400/404). 

## **9.2. Herramientas utilizadas** 

|Herramienta|Uso|
|---|---|
|JUnit 5 (Jupiter)|Framework base para la creación, anotación (@Test) y ejecución de pruebas unitarias<br>en el backend de Java.|
|Mockito|Librería de Mocking para simular dependencias (ej. UserRepository o llamadas a red) y<br>aislar el componente bajo prueba.|
|Jest / RTL|Pruebas unitarias en el Frontend (React) simulando el renderizado del DOM y eventos<br>del usuario sin necesidad de un navegador real.|
|JaCoCo|Plugin de Maven utilizado para medir, auditar y generar el reporte HTML con el<br>porcentaje exacto de cobertura de código (Code Coverage).|
|Postman / Newman|Ejecución de pruebas de integración de API REST (Endpoint Testing), validación de<br>esquemas JSON y códigos HTTP de respuesta.|



## **9.3. Métricas de cobertura** 

|Componente|Cobertura alcanzada|Observación|
|---|---|---|
|Frontend|[65 ]%|Cobertura centrada en componentes visuales<br>principales y validaciones de formularios de login<br>y registro de pacientes.|
|ms-login-user (Identidad)|[75 ]%|Alta cobertura en los filtros de seguridad, lógica<br>de emisión de tokens JWT y validación de<br>credenciales en AuthService.|
|ms-usuarios (Gestión IAM)|[72 ]%|Pruebas enfocadas en las reglas de asignación<br>de roles y permisos. Capas de repositorio<br>excluidas del reporte de cobertura.|
|ms-paciente (Clínico)|[68]%|Pruebas concentradas en las reglas de negocio,<br>validación estricta de formatos de RUT y mapeo<br>de DTOs hacia Entidades JPA.|
|ms-red-centros (Infraestructura)|[63 ]%|Cobertura adecuada validando la lógica de<br>creación de sucursales, pabellones y manejo de<br>excepciones de ubicaciones no encontradas<br>(404).|



|ms-agenda-profesional (Citas)|[70 ]%|Múltiples casos de prueba para validar cruces de<br>horarios, previniendo lógicamente el<br>sobre-agendamiento (doble reserva en un mismo<br>bloque).|
|---|---|---|
|ms-ficha-clinica (Historial)|[66 ]%|Validación rigurosa en el servicio de escritura de<br>evoluciones médicas y diagnósticos. Se<br>"mockeó" la base de datos PostgreSQL<br>exitosamente.|
|ms-urgencias-flujo (Triage)|[64 ]%|Pruebas enfocadas en las transiciones de estado<br>del paciente (ej. de "espera" a "box") y<br>algoritmos de priorización de atención clínica.|
|ms-api-gateway (BFF / Router)|[61 ]%|Pruebas unitarias sobre los filtros globales<br>personalizados (CORS y validación preliminar de<br>headers) antes de enrutar a los servicios.|



## **9.4. Integración de pruebas de API (Postman)** 

Para complementar las pruebas estáticas a nivel de código, se diseñaron pruebas automatizadas de caja negra a nivel de API utilizando Postman. Se estructuró una colección (ej. ms_paciente_postman_collection.json) con llamadas preconfiguradas que incluyen Tests Scripts internos en JavaScript. Estos scripts validan automáticamente tras cada petición: 

- Que el código de respuesta HTTP sea el esperado (pm.response.to.have.status(200);). 

- Que los tiempos de respuesta sean menores a 500ms. 

- Que el payload de respuesta sea un JSON válido y contenga las propiedades obligatorias (ej. validar que al hacer POST, retorne un campo id). 

## **9.5. Evidencias** 

## ● MS-login-user 

## ● MS-Usuarios 

● MS-Pacientes 

## ● MS-red-centros 

## ● MS-agenda-profesional 

● MS-urgencia-flujo 

## **9.6. Relación con patrones de diseño** 

La implementación exitosa de las pruebas unitarias es una consecuencia directa de haber aplicado patrones de diseño correctos en la arquitectura: 

- **Inyección de Dependencias (DI) e Inversión de Control (IoC):** Gracias a que Spring inyecta las dependencias a través del constructor, es posible pasar objetos "Mockeados" a los servicios durante la fase de prueba sin requerir levantar el contexto completo de Spring. 

- **Patrón MVC y Capas (Layered Architecture):** La estricta separación entre el controlador, el servicio y el repositorio asegura que las pruebas unitarias no están fuertemente acopladas. Probar la lógica en el Service no requiere probar la persistencia simultáneamente, lo que eleva drásticamente la mantenibilidad del código base y cumple plenamente con los objetivos de calidad de la rúbrica. 

## **10. Organización de repositorios** 

La entrega debe incluir enlaces a los repositorios GitHub de los componentes, idealmente acompañados de una breve descripción del propósito de cada uno . 

|Repositorio|Propósito|
|---|---|
|Frontend|Portal de pacientes y administrativos (React)|
|Api Gateway|Enrutamiento y validación JWT|
|Service discovery|trabajando|
|MS login user|Microservicio dedicado exclusivamente a la autenticación e inicio de sesión de<br>usuarios, garantizando el acceso seguro a la plataforma del sistema ERP.|
|MS paciente|Microservicio encargado de la gestión integral de pacientes, implementando el<br>estándar de interoperabilidad HL7 FHIR (recurso Patient).|
|MS usuarios|Microservicio de usuarios y personal médico (FHIR Practitioner)|
|MS centros|Administración de ubicaciones (FHIR Organization,Location)|
|MS agenda-profesional|Gestión de bloques de tiempo (FHIR Schedule,Slot)|



|MS reservas-citas|Gestión de la toma, modificación y cancelación de horas programadas (FHIR:<br>Appointment)|
|---|---|
|MS urgencias-flujo|Control de la sala de espera dinámica y el triaje (C1-C5) (FHIR Encounter)|
|MS ficha-clinica|Registro de datos médicos durante la atención. (FHIR: Observation)|
|MS notificaciones|Sistema asíncrono para enviar alertas y confirmaciones (SMS, correos) (FHIR:<br>Communication)|



## **11. Conclusión** 

El desarrollo e implementación del sistema hospitalario RedNorte ha demostrado ser una solución tecnológica efectiva para superar los desafíos de fragmentación y rigidez inherentes a los sistemas de salud tradicionales. A través del diseño de una arquitectura moderna, se logró establecer un ecosistema cohesivo que no solo responde a las problemáticas de lentitud y falta de interoperabilidad, sino que además sienta las bases para un escalamiento futuro seguro e ininterrumpido. 

La adopción de una arquitectura basada en microservicios, orquestada mediante un patrón BFF (Backend For Frontend) / API Gateway, aportó ventajas fundamentales. Esta estructura permitió un aislamiento total de las responsabilidades funcionales (tales como la gestión de usuarios, el historial clínico de pacientes y el flujo de urgencias). En consecuencia, se logró una integración frontend-backend fluida y estandarizada mediante contratos RESTful, ocultando la complejidad de la red subyacente y centralizando la seguridad mediante autenticación asíncrona con tokens JWT. 

Desde el punto de vista de los datos, la estrategia de persistencia implementada utilizando Spring Data JPA y PostgreSQL garantizó que la información crítica hospitalaria mantuviera sus propiedades ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad). La abstracción a través de repositorios protegió el sistema de vulnerabilidades de inyección y facilitó la integración fluida con estándares clínicos de alto nivel como HL7 FHIR, asegurando que el modelo de datos no solo sea consistente internamente, sino interoperable a nivel internacional. 

