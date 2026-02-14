# READMEIA - Contexto técnico para IA

Este archivo resume el prototipo para que una IA pueda entender rápidamente el dominio, módulos, datos y limitaciones.

---

## Resumen del producto
- **Nombre**: Torneo Fut / FutPro (prototipo de gestión de torneos amateur)
- **Objetivo**: centralizar la operación de ligas locales (Orizaba–Córdoba)
- **Plataforma**: Web + PWA (Next.js)
- **Estado**: prototipo sin backend; persistencia local con `localStorage`

---

## Roles
- **admin**: control total (usuarios, torneos, equipos, árbitros, entrenadores, partidos)
- **referee**: gestionar partidos y eventos
- **coach**: gestionar equipos y jugadores
- **fan**: consulta

---

## Entidades principales (campos clave)
- **User**: id, email, name, role, createdAt, photo?
- **Tournament**: id, name, format, startDate, endDate, status, organizerId, rules?, teamIds[]
- **Team**: id, name, tournamentId, logo?, foundedDate?, coachId?
- **Player**: id, name, teamId, position, number, photo?, birthDate?, nationality?, height?, weight?, dominantFoot?, email?, phone?, emergencyContact?, bloodType?, medicalNotes?
- **Referee**: id, name, photo?, license, experience, email, phone?
- **Coach**: id, name, photo?, license?, experience, email, phone?, specialty?
- **Match**: id, tournamentId, homeTeamId, awayTeamId, date, time, venue, status, homeScore?, awayScore?, refereeId?
- **MatchEvent**: id, matchId, type, playerId, teamId, minute, description?
- **Standing**: teamId, played, won, drawn, lost, goalsFor, goalsAgainst, goalDifference, points

---

## Persistencia (localStorage)
- **Torneos**: `futpro_tournaments`
- **Equipos**: `futpro_teams`
- **Jugadores**: `futpro_players`
- **Partidos**: `futpro_matches`
- **Eventos**: `futpro_match_events`
- **Tabla**: `futpro_standings`
- **Árbitros**: `futpro_referees`
- **Entrenadores**: `futpro_coaches`
- **Usuarios** (auth): `futpro_users` y sesión `futpro_user`

---

## Módulos principales
- **Auth**: `lib/auth-context.tsx`, `components/auth/login-form.tsx`
- **Torneos**: `components/tournaments/*`
- **Equipos/Jugadores**: `components/teams/*`, `components/players/*`
- **Partidos**: `components/matches/*`
- **Árbitros/Entrenadores**: `components/referees/*`, `components/coaches/*`
- **Estadísticas**: `components/stats/*`, `lib/stats-calculator.ts`
- **Perfil usuario**: `components/profile/user-profile.tsx`
- **UI base**: `components/ui/*`

---

## Flujo principal
1. `app/page.tsx` valida sesión.
2. Si no hay usuario -> Login.
3. Si hay usuario -> muestra dashboard con tabs y sidebar.
4. `initializeSampleData()` precarga datos si no existen.

---

## Limitaciones del prototipo
- Sin backend ni DB.
- Autenticación simulada (password en localStorage).
- Multiusuario no real (solo local).

---

## Datos de ejemplo
`lib/sample-data.ts` precarga torneos, equipos, jugadores, árbitros, entrenadores, partidos y eventos.

---

## Recomendación para IA
Cuando generes documentos (ESR, manual, etc.), enfatiza:
- Prototipo sin base de datos.
- Enfoque regional Orizaba–Córdoba.
- Roles y módulos CRUD.
- Estadísticas y predicciones simples (no IA real).
