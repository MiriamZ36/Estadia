-- =========================================================
-- RLS: public.profiles
-- Objetivo:
-- - SELECT: cada usuario solo su propio perfil
-- - UPDATE: cada usuario solo su propio perfil
-- - INSERT: opcional, solo su propio perfil (rol fan)
-- - DELETE: bloqueado para usuarios autenticados
-- =========================================================

alter table if exists public.profiles enable row level security;

-- Limpieza idempotente
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own_fan on public.profiles;
drop policy if exists profiles_delete_none on public.profiles;

-- Leer solo tu propio perfil
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- Editar solo tu propio perfil
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Crear solo tu propio perfil como fan
create policy profiles_insert_own_fan
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role = 'fan'
);

-- Bloquear delete para usuarios autenticados
create policy profiles_delete_none
on public.profiles
for delete
to authenticated
using (false);
