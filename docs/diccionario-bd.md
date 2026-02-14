# Diccionario de Base de Datos — Torneo Fut / LigaSmart (Supabase)

Este documento resume tablas, campos, tipos y relaciones para redactar el diccionario de datos del sistema.

> Modelo basado en el prototipo actual y en `docs/supabase.sql`.

---

## 1. Convenciones generales
- **Schema**: `public`.
- **Identificadores**: `uuid` con `gen_random_uuid()`.
- **Fechas**: `date` para fechas de negocio, `timestamptz` para auditoría.
- **Roles**: `admin`, `referee`, `coach`, `fan`.
- **Estados**:
  - Torneo: `upcoming`, `active`, `completed`.
  - Partido: `scheduled`, `live`, `finished`.
- **Auditoría**: `created_at`, `updated_at`.
- **Auth**: Supabase Auth con perfiles en `profiles`.

---

## 2. Tablas

### 2.1 `profiles`
**Propósito**: Perfil de usuario ligado a Supabase Auth.

- `id` uuid PK, FK → `auth.users(id)`
- `name` text, not null
- `role` text, not null, default `fan`, check in (`admin`,`referee`,`coach`,`fan`)
- `photo_url` text, nullable
- `created_at` timestamptz, default now
- `updated_at` timestamptz, default now

**Relaciones**:
- 1:1 con `auth.users`

---

### 2.2 `coaches`
**Propósito**: Entrenadores del sistema.

- `id` uuid PK
- `name` text, not null
- `photo_url` text, nullable
- `license` text, nullable
- `experience` int, not null
- `email` text, not null
- `phone` text, nullable
- `specialty` text, nullable
- `created_at`, `updated_at` timestamptz

**Relaciones**:
- 1:N con `teams`

---

### 2.3 `referees`
**Propósito**: Árbitros del sistema.

- `id` uuid PK
- `name` text, not null
- `photo_url` text, nullable
- `license` text, not null
- `experience` int, not null
- `email` text, not null
- `phone` text, nullable
- `created_at`, `updated_at` timestamptz

**Relaciones**:
- 1:N con `matches`

---

### 2.4 `tournaments`
**Propósito**: Torneos registrados en el sistema.

- `id` uuid PK
- `name` text, not null
- `format` text, check in (`5`,`7`,`11`)
- `start_date` date, not null
- `end_date` date, not null
- `status` text, check in (`upcoming`,`active`,`completed`)
- `organizer_id` uuid, FK → `profiles(id)`
- `rules` text, nullable
- `created_at`, `updated_at` timestamptz

**Relaciones**:
- 1:N con `teams`
- 1:N con `matches`
- 1:N con `standings`

---

### 2.5 `teams`
**Propósito**: Equipos participantes en un torneo.

- `id` uuid PK
- `tournament_id` uuid, FK → `tournaments(id)`
- `name` text, not null
- `logo_url` text, nullable
- `founded_date` date, nullable
- `coach_id` uuid, FK → `coaches(id)`
- `created_at`, `updated_at` timestamptz
- unique(`tournament_id`, `name`)

**Relaciones**:
- N:1 con `tournaments`
- 1:N con `players`
- 1:N con `matches` (como local o visitante)

---

### 2.6 `players`
**Propósito**: Jugadores registrados por equipo.

- `id` uuid PK
- `team_id` uuid, FK → `teams(id)`
- `name` text, not null
- `position` text, not null
- `number` int, not null
- `photo_url` text, nullable
- `birth_date` date, nullable
- `nationality` text, nullable
- `height_cm` int, nullable
- `weight_kg` int, nullable
- `dominant_foot` text, check in (`left`,`right`,`both`)
- `email` text, nullable
- `phone` text, nullable
- `emergency_contact` text, nullable
- `blood_type` text, nullable
- `medical_notes` text, nullable
- `created_at`, `updated_at` timestamptz
- unique(`team_id`, `number`)

**Relaciones**:
- N:1 con `teams`
- 1:N con `match_events`

---

### 2.7 `matches`
**Propósito**: Partidos programados y disputados.

- `id` uuid PK
- `tournament_id` uuid, FK → `tournaments(id)`
- `home_team_id` uuid, FK → `teams(id)`
- `away_team_id` uuid, FK → `teams(id)`
- `match_date` date, not null
- `match_time` time, not null
- `venue` text, not null
- `status` text, check in (`scheduled`,`live`,`finished`)
- `home_score` int, nullable
- `away_score` int, nullable
- `referee_id` uuid, FK → `referees(id)`
- `created_at`, `updated_at` timestamptz

**Relaciones**:
- N:1 con `tournaments`
- N:1 con `teams` (local y visitante)
- 1:N con `match_events`

---

### 2.8 `match_events`
**Propósito**: Eventos registrados durante el partido.

- `id` uuid PK
- `match_id` uuid, FK → `matches(id)`
- `type` text, check in (`goal`,`yellow_card`,`red_card`,`substitution`)
- `player_id` uuid, FK → `players(id)`
- `team_id` uuid, FK → `teams(id)`
- `minute` int, 0–130
- `description` text, nullable
- `created_at` timestamptz

**Relaciones**:
- N:1 con `matches`
- N:1 con `players`
- N:1 con `teams`

---

### 2.9 `standings` (opcional)
**Propósito**: Tabla de posiciones persistida (si se desea almacenar).

- `tournament_id` uuid, FK → `tournaments(id)`
- `team_id` uuid, FK → `teams(id)`
- `played`, `won`, `drawn`, `lost` int
- `goals_for`, `goals_against`, `goal_difference`, `points` int
- `updated_at` timestamptz

**Relaciones**:
- PK compuesta (`tournament_id`, `team_id`)

---

## 3. Reglas de integridad destacadas
- Un equipo pertenece a un torneo.
- Un jugador pertenece a un equipo.
- Un partido pertenece a un torneo y tiene dos equipos distintos.
- Los eventos de partido referencian partido, equipo y jugador.
- La tabla `standings` puede derivarse y no es obligatoria.

---

## 4. Consideraciones para Supabase
- Autenticación con **Supabase Auth** y datos de perfil en `profiles`.
- Para producción, habilitar RLS y políticas por rol.
- Imágenes se guardan como URL o ruta de storage.
