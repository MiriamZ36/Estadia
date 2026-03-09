-- =========================================================
-- RLS: public.standings
-- CRUD objetivo:
-- - SELECT: cualquier usuario autenticado
-- - INSERT/UPDATE/DELETE: solo admin o referee
-- Fuente de rol: public.profiles (id = auth.uid())
-- Nota:
-- - El trigger de estadisticas usa DELETE + INSERT sobre standings.
-- - Por eso se habilitan politicas de escritura para admin/referee.
-- =========================================================

alter table if exists public.standings enable row level security;

-- Limpieza idempotente
drop policy if exists standings_select_authenticated on public.standings;
drop policy if exists standings_insert_admin_referee on public.standings;
drop policy if exists standings_update_admin_referee on public.standings;
drop policy if exists standings_delete_admin_referee on public.standings;

-- Lectura para cualquier usuario autenticado
create policy standings_select_authenticated
on public.standings
for select
to authenticated
using (auth.uid() is not null);

-- Alta de estadisticas: solo admin o referee
create policy standings_insert_admin_referee
on public.standings
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

-- Edicion de estadisticas: solo admin o referee
create policy standings_update_admin_referee
on public.standings
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

-- Eliminacion de estadisticas: solo admin o referee
create policy standings_delete_admin_referee
on public.standings
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
