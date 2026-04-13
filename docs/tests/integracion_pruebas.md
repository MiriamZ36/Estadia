# Pruebas de Integracion Criticas (PWA)

Fecha: 2026-04-13  
Alcance: capa aplicacion (API + flujo PWA), sin cambios de esquema ni RLS.

## IT-01 - Aislamiento de permisos de `coach` sobre recursos ajenos

**Objetivo**  
Validar que un entrenador no pueda editar o eliminar equipos/jugadores que no le pertenecen.

**Criticidad**  
Alta (seguridad/autorizacion).

**Precondiciones**
1. Existe `coach_A` autenticable en la app.
2. Existe `team_A` (del coach_A) y `team_B` (de otro entrenador).
3. Existe `player_B` perteneciente a `team_B`.
4. Sesion activa con cookies/token de `coach_A`.

**Pasos (API)**
1. Intentar editar equipo ajeno:
```bash
curl -i -X PATCH http://localhost:3000/api/teams/<team_B_id> \
  -H "Content-Type: application/json" \
  -H "Cookie: <cookie_sesion_coach_A>" \
  -d '{"name":"Cambio no autorizado"}'
```
2. Intentar eliminar equipo ajeno:
```bash
curl -i -X DELETE http://localhost:3000/api/teams/<team_B_id> \
  -H "Cookie: <cookie_sesion_coach_A>"
```
3. Intentar editar jugador ajeno:
```bash
curl -i -X PATCH http://localhost:3000/api/players/<player_B_id> \
  -H "Content-Type: application/json" \
  -H "Cookie: <cookie_sesion_coach_A>" \
  -d '{"name":"Jugador no autorizado","teamId":"<team_B_id>","position":"MID","number":99}'
```

**Resultado esperado**
1. Respuesta `403` en los 3 intentos.
2. Mensaje de error de permisos.
3. Ningun cambio persistido en `teams` ni `players`.

**Validacion en BD (opcional)**
```sql
select id, name from public.teams where id = '<team_B_id>';
select id, name, team_id from public.players where id = '<player_B_id>';
```

**Criterio de aprobacion**
- La prueba pasa solo si todas las mutaciones no autorizadas son bloqueadas.

**Nota de estado actual**
- Esta prueba es clave para detectar el hueco actual de ownership en APIs.

---

## IT-02 - Reglas de programacion al crear partidos

**Objetivo**  
Validar reglas de negocio al crear partidos:
1. No permitir mismo equipo vs mismo equipo.  
2. Ambos equipos deben pertenecer al mismo torneo.  
3. El torneo debe estar `upcoming` o `active`.  
4. La fecha del partido debe caer dentro del rango del torneo.

**Criticidad**  
Alta (integridad funcional del calendario y datos deportivos).

**Precondiciones**
1. Sesion activa de `admin` o `referee`.
2. `team_1` y `team_2` existentes con torneo conocido.
3. Un torneo `active/upcoming` con rango de fechas definido.

**Pasos (API)**
1. Caso invalido: mismo equipo:
```bash
curl -i -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -H "Cookie: <cookie_sesion_admin>" \
  -d '{"homeTeamId":"<team_1>","awayTeamId":"<team_1>","date":"2026-07-10","time":"19:00","venue":"Cancha 1"}'
```
2. Caso invalido: equipos de torneos distintos:
```bash
curl -i -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -H "Cookie: <cookie_sesion_admin>" \
  -d '{"homeTeamId":"<team_1_torneo_A>","awayTeamId":"<team_2_torneo_B>","date":"2026-07-10","time":"19:00","venue":"Cancha 1"}'
```
3. Caso invalido: fecha fuera de rango del torneo:
```bash
curl -i -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -H "Cookie: <cookie_sesion_admin>" \
  -d '{"homeTeamId":"<team_1>","awayTeamId":"<team_2>","date":"2030-01-01","time":"19:00","venue":"Cancha 1"}'
```
4. Caso valido:
```bash
curl -i -X POST http://localhost:3000/api/matches \
  -H "Content-Type: application/json" \
  -H "Cookie: <cookie_sesion_admin>" \
  -d '{"homeTeamId":"<team_1>","awayTeamId":"<team_2>","date":"<fecha_en_rango>","time":"19:00","venue":"Cancha 1","status":"scheduled"}'
```

**Resultado esperado**
1. Casos 1-3 devuelven `400` con mensaje de validacion.
2. Caso 4 devuelve `200` y objeto `match` creado.
3. El partido valido queda persistido y visible en modulo Partidos.

**Validacion en BD (opcional)**
```sql
select id, tournament_id, home_team_id, away_team_id, match_date, status
from public.matches
where home_team_id = '<team_1>' and away_team_id = '<team_2>'
order by created_at desc
limit 1;
```

**Criterio de aprobacion**
- Todas las reglas invalidas son rechazadas y el caso valido se crea correctamente.

---

## Evidencia minima a guardar
1. Captura de respuesta HTTP (codigo + body) por cada paso.
2. Captura del modulo correspondiente en UI (cuando aplique).
3. Resultado SQL de verificacion final.
