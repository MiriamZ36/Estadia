-- =========================================================
-- RLS: public.coaches
-- CRUD objetivo:
-- - SELECT: cualquier usuario autenticado
-- - INSERT/UPDATE/DELETE: solo admin
-- Fuente de rol: public.profiles (id = auth.uid())
-- =========================================================

alter table if exists public.coaches enable row level security;

-- Limpieza idempotente
drop policy if exists coaches_select_authenticated on public.coaches;
drop policy if exists coaches_insert_admin on public.coaches;
drop policy if exists coaches_update_admin on public.coaches;
drop policy if exists coaches_delete_admin on public.coaches;

-- Lectura para cualquier usuario autenticado
create policy coaches_select_authenticated
on public.coaches
for select
to authenticated
using (auth.uid() is not null);

-- Alta de entrenadores: solo admin
create policy coaches_insert_admin
on public.coaches
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

-- Edicion de entrenadores: solo admin
create policy coaches_update_admin
on public.coaches
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

-- Eliminacion de entrenadores: solo admin
create policy coaches_delete_admin
on public.coaches
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
