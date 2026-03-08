-- =========================================================
-- RLS: public.players
-- CRUD objetivo:
-- - SELECT: cualquier usuario autenticado
-- - INSERT/UPDATE/DELETE: solo admin o coach
-- Fuente de rol: public.profiles (id = auth.uid())
-- =========================================================

alter table if exists public.players enable row level security;

-- Limpieza idempotente
drop policy if exists players_select_authenticated on public.players;
drop policy if exists players_insert_admin_coach on public.players;
drop policy if exists players_update_admin_coach on public.players;
drop policy if exists players_delete_admin_coach on public.players;

-- Lectura para cualquier usuario autenticado
create policy players_select_authenticated
on public.players
for select
to authenticated
using (auth.uid() is not null);

-- Alta de jugadores: admin o coach
create policy players_insert_admin_coach
on public.players
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'coach')
  )
);

-- Edicion de jugadores: admin o coach
create policy players_update_admin_coach
on public.players
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'coach')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'coach')
  )
);

-- Eliminacion de jugadores: admin o coach
create policy players_delete_admin_coach
on public.players
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'coach')
  )
);

