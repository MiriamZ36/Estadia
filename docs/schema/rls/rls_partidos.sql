-- =========================================================
-- RLS: public.matches
-- CRUD objetivo:
-- - SELECT: cualquier usuario autenticado
-- - INSERT/UPDATE/DELETE: solo admin o referee
-- Fuente de rol: public.profiles (id = auth.uid())
-- =========================================================

alter table if exists public.matches enable row level security;

-- Limpieza idempotente
drop policy if exists matches_select_authenticated on public.matches;
drop policy if exists matches_insert_admin_referee on public.matches;
drop policy if exists matches_update_admin_referee on public.matches;
drop policy if exists matches_delete_admin_referee on public.matches;

-- Lectura para cualquier usuario autenticado
create policy matches_select_authenticated
on public.matches
for select
to authenticated
using (auth.uid() is not null);

-- Alta de partidos: admin o referee
create policy matches_insert_admin_referee
on public.matches
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'referee')
  )
);

-- Edicion de partidos: admin o referee
create policy matches_update_admin_referee
on public.matches
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
);

-- Eliminacion de partidos: admin o referee
create policy matches_delete_admin_referee
on public.matches
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
