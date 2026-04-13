# Hotfixes Prioritarios (Auditoria Tecnica)

Fecha: 2026-04-13  
Proyecto: Torneo Fut (Next.js + Supabase)

## Objetivo
Definir un plan de correcciones para cerrar brechas funcionales actuales en la capa PWA/app: remanentes de mock/localStorage, autorizacion por roles en backend de aplicacion y limpieza tecnica para operar 100% con Supabase sin modificar esquema ni RLS.

## Resumen Ejecutivo
Hoy la app ya tiene CRUDs reales en varios modulos, pero aun conviven rutas/componentes del prototipo local. El principal riesgo es de **autorizacion en capa de app**: varias APIs usan `service_role` y validan solo rol general (`admin|coach`) sin validar pertenencia del recurso (equipo del entrenador), lo que permite sobre-alcance funcional.

## Hallazgos Clave
## 1) Mock/localStorage aun activo
- `app/page.tsx` ejecuta `initializeSampleData()` desde `lib/sample-data`.
- `components/tournaments/tournament-fixtures.tsx` y `components/tournaments/fixture-dialog.tsx` usan `lib/storage`.
- `components/users/user-management.tsx` conserva accion "Limpiar Datos" con `clearDataExceptUsers()` (`lib/storage`).
- `lib/storage.ts` y `lib/sample-data.ts` siguen operativos para datos de negocio.
- `fixture-dialog.tsx` aun usa `alert(...)` del navegador y genera IDs locales.

## 2) Autorizacion por rol y alcance (ownership) incompleta
- Endpoints CRUD de equipos/jugadores permiten `coach` por rol, pero sin restriccion por equipo asignado.
- Uso extendido de `createSupabaseAdminClient()` en APIs de negocio; si no se valida ownership en app, se ignora el espiritu de RLS para ese flujo.
- La restriccion fina de ownership debe resolverse en API/app (sin cambios de RLS por esta solicitud).

## 3) Documentacion desactualizada
- `docs/README.md`, `docs/READMEIA.md`, `docs/ESR-IEEE830.md` aun describen sistema "prototipo sin backend" con localStorage.

## 4) Calidad tecnica pendiente
- Hay errores TS heredados reportados (ej. login/soccer-field), no bloqueantes para todo flujo pero si para hardening final.
- Existen patrones de UI mezclados (algunos modulos 100% API, otros con legado local).

## Modelo de Roles Objetivo (Recomendado)
- `admin`: control total (CRUD completo en todas las entidades).
- `coach`: solo lectura global de catalogos, y escritura limitada a su equipo:
  - `teams`: editar solo su equipo (no eliminar torneos ni equipos ajenos).
  - `players`: CRUD solo de jugadores de su equipo.
  - `matches`: sin CRUD administrativo (solo lectura), salvo que negocio defina otra cosa.
- `referee`: gestionar partidos/eventos segun asignacion (ideal: solo partidos donde `referee_id = auth user referee`).
- `fan`: solo lectura permitida.

Nota: por alcance actual no se modifica esquema ni RLS. El ownership se controlara en API/app con las columnas existentes.

## Plan de Correccion (Priorizado)

## Fase 0 - Seguridad y permisos en capa app (P0)
1. Endurecer APIs con validacion de alcance (defensa en profundidad).
- En `app/api/teams*` y `app/api/players*`, validar ownership antes de mutaciones si rol `coach`.
- Rechazar cambios de `coach` sobre equipos/jugadores fuera de su alcance.

2. Partidos y eventos por arbitro asignado (opcional alto valor).
- Limitar `PATCH/POST` de `matches` y `match-events` para `referee` asignado (o `admin`).

Criterio de aceptacion Fase 0:
- Un coach no puede editar equipos/jugadores fuera de su equipo (ni por API directa).
- Pruebas manuales y/o test de integración cubren casos permitidos/prohibidos.

## Fase 1 - Eliminar remanentes mock/localStorage (P0)
1. Desconectar inicializacion mock.
- Quitar `initializeSampleData()` de `app/page.tsx`.

2. Migrar modulo de fixtures legado a APIs reales.
- Reemplazar uso de `lib/storage` en:
  - `components/tournaments/tournament-fixtures.tsx`
  - `components/tournaments/fixture-dialog.tsx`
- Consumir `/api/matches` y `/api/matches/[id]`.
- Sustituir `alert(...)` por `toast` del sistema.

3. Retirar flujo "Limpiar Datos" local del modulo usuarios.
- Eliminar `clearDataExceptUsers()` y referencias a `lib/storage`.

4. Deprecar `lib/storage.ts` y `lib/sample-data.ts` para negocio.
- Si se conservan, dejarlos solo como utilidades de desarrollo aisladas y no importadas por produccion.

Criterio de aceptacion Fase 1:
- `rg "lib/storage|sample-data|initializeSampleData|alert\\(" app components` sin coincidencias de negocio activas.

## Fase 2 - Consistencia de autorizacion en server/app (P1)
1. Centralizar guard de autenticacion/rol.
- Crear helper comun (`getSessionProfileOrThrow`) para evitar duplicacion y drift entre rutas.

2. Politica de uso de cliente Supabase por endpoint.
- Lecturas del propio usuario: `createSupabaseServerClient`.
- Operaciones administrativas: `createSupabaseAdminClient` + validacion fuerte de alcance.

3. Revisar coherencia funcional de permisos en endpoints existentes.
- `coaches`, `referees`, `matches`, `match_events`, `standings`, `profiles` desde la capa API.
- No se proponen cambios de RLS ni de esquema por esta solicitud.

Criterio de aceptacion Fase 2:
- Matriz de permisos documentada y ejecutable en pruebas de API.

## Fase 3 - UX de carga y errores (P1)
1. Estandarizar `ProgressDialog` en cargas iniciales por modulo.
- Ya existe en muchos modulos; cerrar brechas en componentes heredados.

2. Homologar mensajes de error backend/frontend.
- Evitar textos ambiguos.
- Incluir codigos de error internos cuando aplique.

3. Remover alertas nativas restantes.

Criterio de aceptacion Fase 3:
- Ninguna vista de gestion usa `alert()` del navegador.
- Toda consulta inicial muestra y cierra progreso correctamente.

## Fase 4 - Documentacion y deuda tecnica (P2)
1. Actualizar docs base.
- `docs/README.md`, `docs/READMEIA.md`, `docs/ESR-IEEE830.md` a estado real Supabase.

2. Resolver errores TS pendientes y lint baseline.
- Login/form y componentes deportivos heredados.

3. Checklist de despliegue.
- Variables de entorno, bucket `fotos`, seed admin, y validaciones de API.

Criterio de aceptacion Fase 4:
- Documentacion alineada al estado real.
- `npm run build` y chequeos de tipos/lint en verde.

## Backlog Tecnico Concreto por Archivo
- `app/page.tsx`: eliminar `initializeSampleData`.
- `components/tournaments/tournament-fixtures.tsx`: migrar a fetch real.
- `components/tournaments/fixture-dialog.tsx`: quitar `alert`, quitar IDs locales, usar APIs.
- `components/users/user-management.tsx`: retirar "Limpiar Datos" local y dependencia `lib/storage`.
- `app/api/teams/route.ts` y `app/api/teams/[id]/route.ts`: ownership por coach.
- `app/api/players/route.ts` y `app/api/players/[id]/route.ts`: ownership por coach.

## Orden de Ejecucion Sugerido (Sprint corto)
1. Fase 0 completa (seguridad/roles).
2. Fase 1 completa (retiro de mock/local).
3. Fase 2 (normalizacion auth/RLS).
4. Fase 3 y 4 (UX/documentacion/calidad).

## Riesgos si no se corrige
- Coaches con permisos sobre recursos ajenos.
- Comportamientos inconsistentes entre modulos (unos contra Supabase, otros contra localStorage).
- Dificultad de soporte por documentacion en conflicto con el estado real.

## Definicion de Terminado (DoD)
- Sin dependencia activa de `lib/storage`/`lib/sample-data` en flujos productivos.
- Roles y ownership implementados en API/capa app (sin tocar esquema ni RLS).
- Modulos CRUD principales operando con datos reales y permisos correctos.
- Documentacion alineada con el codigo desplegable.
