-- =========================================================
-- Storage RLS: bucket fotos
-- CRUD objetivo:
-- - SELECT: publico (anon + authenticated)
-- - INSERT/UPDATE/DELETE: solo admin o coach
-- Fuente de rol: public.profiles (id = auth.uid())
-- =========================================================

-- Asegura que el bucket exista y sea publico
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do update
set public = true;

-- Nota:
-- storage.objects ya usa RLS en Supabase. No se ejecuta ALTER TABLE
-- porque normalmente este rol no es owner de la tabla.

-- Limpieza idempotente
drop policy if exists fotos_select_public on storage.objects;
drop policy if exists fotos_insert_admin_coach on storage.objects;
drop policy if exists fotos_update_admin_coach on storage.objects;
drop policy if exists fotos_delete_admin_coach on storage.objects;

-- Lectura publica de imagenes del bucket fotos
create policy fotos_select_public
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'fotos');

-- Alta de archivos: admin o coach
create policy fotos_insert_admin_coach
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'fotos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'coach')
  )
);

-- Edicion/reemplazo de archivos: admin o coach
create policy fotos_update_admin_coach
on storage.objects
for update
to authenticated
using (
  bucket_id = 'fotos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'coach')
  )
)
with check (
  bucket_id = 'fotos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'coach')
  )
);

-- Eliminacion de archivos: admin o coach
create policy fotos_delete_admin_coach
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'fotos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'coach')
  )
);
