-- =========================================================
-- RLS: public.match_events
-- CRUD objetivo:
-- - SELECT: cualquier usuario autenticado
-- - INSERT/UPDATE/DELETE: solo admin o referee
-- Fuente de rol: public.profiles (id = auth.uid())
-- Reglas de integridad:
-- - team_id debe pertenecer al partido (local/visitante)
-- - player_id debe pertenecer al team_id del evento
-- =========================================================

alter table if exists public.match_events enable row level security;

-- Limpieza idempotente
drop policy if exists match_events_select_authenticated on public.match_events;
drop policy if exists match_events_insert_admin_referee on public.match_events;
drop policy if exists match_events_update_admin_referee on public.match_events;
drop policy if exists match_events_delete_admin_referee on public.match_events;

-- Lectura para cualquier usuario autenticado
create policy match_events_select_authenticated
on public.match_events
for select
to authenticated
using (auth.uid() is not null);

-- Alta de eventos: admin o referee + validaciones de integridad
create policy match_events_insert_admin_referee
on public.match_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'referee')
  )
  and exists (
    select 1
    from public.matches m
    where m.id = public.match_events.match_id
      and (m.home_team_id = public.match_events.team_id or m.away_team_id = public.match_events.team_id)
  )
  and exists (
    select 1
    from public.players pl
    where pl.id = public.match_events.player_id
      and pl.team_id = public.match_events.team_id
  )
);

-- Edicion de eventos: admin o referee + validaciones de integridad
create policy match_events_update_admin_referee
on public.match_events
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'referee')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'referee')
  )
  and exists (
    select 1
    from public.matches m
    where m.id = public.match_events.match_id
      and (m.home_team_id = public.match_events.team_id or m.away_team_id = public.match_events.team_id)
  )
  and exists (
    select 1
    from public.players pl
    where pl.id = public.match_events.player_id
      and pl.team_id = public.match_events.team_id
  )
);

-- Eliminacion de eventos: admin o referee
create policy match_events_delete_admin_referee
on public.match_events
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'referee')
  )
);
