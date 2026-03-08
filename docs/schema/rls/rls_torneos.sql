-- =========================================================
-- RLS: public.tournaments
-- CRUD objetivo:
-- - SELECT: cualquier usuario autenticado
-- - INSERT/UPDATE/DELETE: solo admin
-- Fuente de rol: public.profiles (id = auth.uid())
-- =========================================================

alter table if exists public.tournaments enable row level security;

-- Limpieza idempotente
drop policy if exists tournaments_select_authenticated on public.tournaments;
drop policy if exists tournaments_insert_admin on public.tournaments;
drop policy if exists tournaments_update_admin on public.tournaments;
drop policy if exists tournaments_delete_admin on public.tournaments;

-- Lectura para cualquier usuario autenticado
create policy tournaments_select_authenticated
on public.tournaments
for select
to authenticated
using (auth.uid() is not null);

-- Alta de torneos: solo admin
create policy tournaments_insert_admin
on public.tournaments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- Edicion de torneos: solo admin
create policy tournaments_update_admin
on public.tournaments
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- Eliminacion de torneos: solo admin
create policy tournaments_delete_admin
on public.tournaments
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

