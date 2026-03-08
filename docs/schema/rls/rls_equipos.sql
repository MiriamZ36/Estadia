-- =========================================================
-- RLS: public.teams
-- CRUD objetivo:
-- - SELECT: cualquier usuario autenticado
-- - INSERT/UPDATE/DELETE: solo admin o coach
-- Fuente de rol: public.profiles (id = auth.uid())
-- =========================================================

alter table if exists public.teams enable row level security;

-- Limpieza idempotente
drop policy if exists teams_select_authenticated on public.teams;
drop policy if exists teams_insert_admin_coach on public.teams;
drop policy if exists teams_update_admin_coach on public.teams;
drop policy if exists teams_delete_admin_coach on public.teams;

-- Lectura para cualquier usuario autenticado
create policy teams_select_authenticated
on public.teams
for select
to authenticated
using (auth.uid() is not null);

-- Alta de equipos: admin o coach
create policy teams_insert_admin_coach
on public.teams
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

-- Edicion de equipos: admin o coach
create policy teams_update_admin_coach
on public.teams
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

-- Eliminacion de equipos: admin o coach
create policy teams_delete_admin_coach
on public.teams
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

