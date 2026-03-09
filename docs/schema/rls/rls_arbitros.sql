-- =========================================================
-- RLS: public.referees
-- CRUD objetivo:
-- - SELECT: cualquier usuario autenticado
-- - INSERT/UPDATE/DELETE: solo admin
-- Fuente de rol: public.profiles (id = auth.uid())
-- =========================================================

alter table if exists public.referees enable row level security;

-- Limpieza idempotente
drop policy if exists referees_select_authenticated on public.referees;
drop policy if exists referees_insert_admin on public.referees;
drop policy if exists referees_update_admin on public.referees;
drop policy if exists referees_delete_admin on public.referees;

-- Lectura para cualquier usuario autenticado
create policy referees_select_authenticated
on public.referees
for select
to authenticated
using (auth.uid() is not null);

-- Alta de arbitros: solo admin
create policy referees_insert_admin
on public.referees
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

-- Edicion de arbitros: solo admin
create policy referees_update_admin
on public.referees
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

-- Eliminacion de arbitros: solo admin
create policy referees_delete_admin
on public.referees
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
