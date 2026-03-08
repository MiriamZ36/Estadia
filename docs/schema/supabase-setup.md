# Configuracion inicial de Supabase

Este proyecto ya tiene preparada la base minima para conectarse a Supabase desde Next.js.

## Variables requeridas

En `.env` deben existir:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Archivos agregados

- `lib/supabase/env.ts`: valida variables de entorno
- `lib/supabase/client.ts`: cliente para componentes cliente
- `lib/supabase/server.ts`: cliente para server components y route handlers
- `lib/supabase/admin.ts`: cliente server-only con service role
- `app/api/supabase-status/route.ts`: endpoint simple para validar conexion

## Verificacion

Con el proyecto corriendo, abre:

`/api/supabase-status`

Si responde:

```json
{ "ok": true, "message": "Supabase connection is configured correctly" }
```

la configuracion inicial esta funcionando.

## Nota

`SUPABASE_SERVICE_ROLE_KEY` solo debe usarse en servidor. No debe importarse en archivos con `"use client"`.
