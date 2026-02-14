# ESR/ERS IEEE 830 — Información base del proyecto

Este documento concentra la información necesaria para redactar la **Especificación de Requisitos de Software (ERS/ESR)** conforme a **IEEE 830** del proyecto **Torneo Fut / FutPro**.

> Estado: prototipo funcional sin backend. Persistencia local mediante `localStorage` con datos de ejemplo.

---

## 1. Introducción

### 1.1 Propósito
Definir los requisitos funcionales y no funcionales del sistema web/PWA de gestión de torneos de fútbol amateur para la región Orizaba–Córdoba, desarrollado como prototipo de estadía.

### 1.2 Alcance
El sistema centraliza el registro y operación de ligas locales: torneos, equipos, jugadores, árbitros, entrenadores y partidos. Permite programación de encuentros, captura de eventos, tablas de posiciones, estadísticas y predicciones simples. No hay integración con servicios externos ni base de datos real en esta versión.

### 1.3 Definiciones, acrónimos y abreviaturas
- **ESR/ERS**: Especificación de Requisitos de Software.
- **PWA**: Progressive Web App.
- **CRUD**: Create, Read, Update, Delete.
- **Match Event**: Evento en partido (gol, tarjeta, sustitución).
- **Standings**: Tabla de posiciones.

### 1.4 Referencias
- IEEE 830-1998 (guía de requisitos).
- Documentación interna del prototipo (código fuente y documentación en `docs/`).

### 1.5 Visión general del documento
Resumen de secciones: descripción general, requisitos específicos, apéndices y glosario.

---

## 2. Descripción general

### 2.1 Perspectiva del producto
Aplicación web/PWA construida con Next.js (App Router). Persistencia simulada en `localStorage`. Sin API ni base de datos real. Incluye módulos de torneos, equipos, jugadores, árbitros, entrenadores, partidos, estadísticas y usuarios.

### 2.2 Funciones del producto (resumen)
- Autenticación básica (login/registro local).
- Administración de usuarios (solo admin).
- Gestión de torneos (CRUD).
- Gestión de equipos (CRUD) y asociación a torneos.
- Gestión de jugadores (CRUD) y asignación a equipos.
- Programación de partidos y asignación de árbitro.
- Registro de eventos durante el partido.
- Tablas de posiciones y estadísticas.
- Predicciones simples basadas en métricas de standings.

### 2.3 Clases de usuarios
- **Administrador**: control total del sistema.
- **Árbitro**: gestiona partidos y eventos.
- **Entrenador**: gestiona equipos y jugadores.
- **Aficionado**: acceso de consulta.

### 2.4 Entorno operativo
- Navegadores modernos (Chrome, Edge, Firefox, Safari).
- Modo PWA instalable.
- Operación local sin dependencia de red.

### 2.5 Restricciones de diseño e implementación
- Persistencia exclusiva en `localStorage`.
- Sin autenticación real ni cifrado de contraseñas (prototipo).
- No hay multiusuario real (solo simulación local).

### 2.6 Suposiciones y dependencias
- El navegador soporta `localStorage`.
- El prototipo no requiere servidores externos.
- Datos iniciales precargados con `initializeSampleData()`.

---

## 3. Requisitos específicos

### 3.1 Requisitos funcionales (RF)

#### RF-01 Autenticación
- **Descripción**: el sistema permite iniciar sesión y registrar usuarios.
- **Entradas**: email, contraseña; nombre, rol.
- **Salida**: sesión activa en navegador.
- **Notas**: credenciales en `localStorage`.

#### RF-02 Gestión de usuarios (Admin)
- **Descripción**: el administrador crea y elimina usuarios.
- **Restricción**: no puede eliminarse a sí mismo.

#### RF-03 Gestión de torneos
- **Descripción**: crear, editar, eliminar y listar torneos.
- **Campos**: nombre, formato, fechas, estado, reglas, equipos.

#### RF-04 Gestión de equipos
- **Descripción**: crear, editar, eliminar equipos por torneo.
- **Campos**: nombre, logo, torneo, fecha de fundación, entrenador.

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
- **RNF-01 Usabilidad**: UI responsive y usable en móvil.
- **RNF-02 Rendimiento**: operaciones locales < 1s en equipos comunes.
- **RNF-03 Portabilidad**: compatible con navegadores modernos.
- **RNF-04 Seguridad**: no hay cifrado ni políticas reales (prototipo).
- **RNF-05 Disponibilidad**: funciona offline con datos locales.

### 3.3 Interfaces externas
- **Interfaz de usuario**: web/PWA.
- **Interfaz de hardware**: carga de foto opcional.
- **Interfaz de software**: ninguna (sin APIs externas).

### 3.4 Requisitos de datos
- Persistencia local en `localStorage` con claves específicas.
- Datos iniciales cargados por `initializeSampleData()`.

### 3.5 Requisitos de calidad
- **Mantenibilidad**: módulos por dominio (torneos, equipos, etc.).
- **Escalabilidad**: limitada por diseño (local y sin backend).

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

### 4.3 Checklist para completar la ESR
- [ ] Validar alcance con el asesor.
- [ ] Confirmar terminología usada (FutPro).
- [ ] Ajustar requisitos según evaluación con ligas reales.
- [ ] Agregar casos de uso relevantes.
- [ ] Añadir criterios de aceptación por requisito.

---

## 5. Módulos y archivos de referencia (para soporte de la ESR)

- **Auth**: `lib/auth-context.tsx`, `components/auth/login-form.tsx`
- **Torneos**: `components/tournaments/*`
- **Equipos/Jugadores**: `components/teams/*`, `components/players/*`
- **Partidos**: `components/matches/*`
- **Árbitros/Entrenadores**: `components/referees/*`, `components/coaches/*`
- **Estadísticas**: `components/stats/*`, `lib/stats-calculator.ts`
- **Perfil usuario**: `components/profile/user-profile.tsx`
- **UI base**: `components/ui/*`
- **Persistencia local**: `lib/storage.ts`
- **Datos de ejemplo**: `lib/sample-data.ts`
