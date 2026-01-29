# Guía para redactar la ESR (IEEE 830)

Este documento reúne la información necesaria para redactar la **Especificación de Requisitos de Software (ERS/ESR)** del proyecto **Torneo Fut / LigaSmart** conforme a **IEEE 830**. Incluye un esquema recomendado, contenido base del proyecto y notas clave.

> Estado: Prototipo funcional (sin base de datos real). Persistencia local con `localStorage` y datos de ejemplo precargados.

---

## 1. Introducción

### 1.1 Propósito
Definir los requisitos funcionales y no funcionales del sistema inteligente de gestión de torneos de fútbol amateur orientado a la región Orizaba–Córdoba, desarrollado como proyecto de estadía y presentado como prototipo web/PWA.

### 1.2 Alcance
El sistema centraliza el registro de torneos, equipos, jugadores, árbitros, entrenadores y partidos. Permite programación de encuentros, captura de eventos en tiempo real, generación de estadísticas, tablas de posiciones y predicciones simples. Se ofrece un portal privado para operación y consulta interna (roles). No hay integración con servicios externos ni base de datos en esta versión.

### 1.3 Definiciones, acrónimos y abreviaturas
- **ESR/ERS**: Especificación de Requisitos de Software.
- **PWA**: Progressive Web App.
- **CRUD**: Create, Read, Update, Delete.
- **Match Event**: Evento de partido (gol, tarjeta, sustitución).
- **Standings**: Tabla de posiciones.

### 1.4 Referencias
- IEEE 830-1998 (plantilla de requisitos).
- Documentación interna del prototipo (código fuente).

### 1.5 Visión general del documento
Resumen de las secciones principales de la ESR: descripción general, requisitos específicos, apéndices y glosario.

---

## 2. Descripción general

### 2.1 Perspectiva del producto
Aplicación web/PWA desarrollada con Next.js. La persistencia se simula con `localStorage`. No existe API ni base de datos real en este prototipo. El sistema incluye módulos UI para torneos, equipos, jugadores, árbitros, entrenadores, partidos, estadísticas y usuarios.

### 2.2 Funciones del producto (resumen)
- Autenticación básica (login/registro).
- Administración de usuarios (solo admin).
- Gestión de torneos (CRUD).
- Gestión de equipos (CRUD) y asociación a torneos.
- Gestión de jugadores (CRUD) y asignación a equipos.
- Programación de partidos y asignación de árbitro.
- Registro de eventos durante el partido.
- Tablas de posiciones y estadísticas.
- Predicciones simples basadas en métricas.

### 2.3 Clases de usuarios
- **Administrador**: gestión total del sistema (usuarios, torneos, equipos, árbitros, entrenadores, partidos, datos).
- **Árbitro**: puede gestionar partidos y eventos.
- **Entrenador**: puede gestionar equipos y jugadores.
- **Aficionado**: acceso de consulta.

### 2.4 Entorno operativo
- Navegador moderno (Chrome, Edge, Firefox, Safari).
- Modo PWA instalable.
- Sin servidor backend; persistencia local.

### 2.5 Restricciones de diseño e implementación
- Persistencia exclusiva en `localStorage`.
- Sin autenticación real ni cifrado de contraseñas.
- No hay multiusuario real (solo simulación local).

### 2.6 Suposiciones y dependencias
- El usuario usa un navegador con soporte de `localStorage`.
- El prototipo no requiere disponibilidad de red.
- Los datos iniciales se precargan con datos de ejemplo.

---

## 3. Requisitos específicos

### 3.1 Requisitos funcionales (RF)

#### RF-01 Autenticación
- **Descripción**: El sistema debe permitir iniciar sesión y registrar usuarios.
- **Entradas**: email, contraseña; nombre, rol.
- **Salida**: sesión activa en navegador.
- **Notas**: las credenciales se almacenan en `localStorage`.

#### RF-02 Gestión de usuarios (Admin)
- **Descripción**: El administrador puede crear y eliminar usuarios.
- **Restricción**: no puede eliminarse a sí mismo.

#### RF-03 Gestión de torneos
- **Descripción**: crear, editar, eliminar y listar torneos.
- **Campos**: nombre, formato, fechas, estado, reglas, equipos.

#### RF-04 Gestión de equipos
- **Descripción**: crear, editar, eliminar equipos por torneo.
- **Campos**: nombre, logo, torneo, fecha de fundación.

#### RF-05 Gestión de jugadores
- **Descripción**: crear, editar, eliminar jugadores; asignación a equipo.
- **Campos**: personales, posición, número, datos físicos y contacto.

#### RF-06 Gestión de árbitros
- **Descripción**: crear, editar, eliminar árbitros.
- **Campos**: nombre, licencia, experiencia, contacto.

#### RF-07 Gestión de entrenadores
- **Descripción**: crear, editar, eliminar entrenadores.
- **Campos**: nombre, licencia, experiencia, especialidad, contacto.

#### RF-08 Programación de partidos
- **Descripción**: crear/editar partidos y asignar árbitro.
- **Campos**: equipos, fecha, hora, sede, estado, marcador.

#### RF-09 Registro de eventos de partido
- **Descripción**: registrar goles, tarjetas, sustituciones en tiempo real.

#### RF-10 Estadísticas
- **Descripción**: generar tabla de posiciones, goleadores, gráficas.

#### RF-11 Predicciones
- **Descripción**: mostrar predicciones de resultado basadas en standings.
- **Nota**: modelo simple, no IA real.

### 3.2 Requisitos no funcionales (RNF)
- **RNF-01 Usabilidad**: UI responsive, accesible en móvil.
- **RNF-02 Rendimiento**: operaciones locales en <1s en equipos comunes.
- **RNF-03 Portabilidad**: compatible con navegadores modernos.
- **RNF-04 Seguridad**: no se maneja cifrado; es prototipo.
- **RNF-05 Disponibilidad**: funciona offline (datos locales).

### 3.3 Interfaces externas
- **Interfaz de usuario**: web/PWA.
- **Interfaz de hardware**: cámara para foto (opcional vía subida).
- **Interfaz de software**: ninguna (sin APIs externas).

### 3.4 Requisitos de datos
- Persistencia en `localStorage` con claves específicas.
- Datos iniciales cargados por `initializeSampleData()`.

### 3.5 Requisitos de calidad
- **Mantenibilidad**: módulos por dominio.
- **Escalabilidad**: limitada (no multiusuario real).

---

## 4. Apéndices

### 4.1 Modelo de datos (resumen)
- **User**: id, email, name, role, createdAt, photo?
- **Tournament**: id, name, format, startDate, endDate, status, organizerId, rules?, teamIds
- **Team**: id, name, tournamentId, logo?, foundedDate?, coachId?
- **Player**: id, name, teamId, position, number, photo?, birthDate?, nationality?, height?, weight?, dominantFoot?, email?, phone?, emergencyContact?, bloodType?, medicalNotes?
- **Referee**: id, name, photo?, license, experience, email, phone?
- **Coach**: id, name, photo?, license?, experience, email, phone?, specialty?
- **Match**: id, tournamentId, homeTeamId, awayTeamId, date, time, venue, status, homeScore?, awayScore?, refereeId?
- **MatchEvent**: id, matchId, type, playerId, teamId, minute, description?
- **Standing**: teamId, played, won, drawn, lost, goalsFor, goalsAgainst, goalDifference, points

### 4.2 Notas de prototipo
- No hay base de datos real.
- Usuarios y datos viven solo en el navegador local.
- La autenticación es simulada.

---

## 5. Checklist para completar la ESR
- [ ] Validar alcance con el asesor.
- [ ] Confirmar terminología usada (Torneo Fut / LigaSmart / FutPro).
- [ ] Ajustar requisitos según evaluación con ligas reales.
- [ ] Agregar casos de uso relevantes.
- [ ] Añadir criterios de aceptación por requisito.

