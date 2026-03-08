import "server-only"

import { createClient } from "@supabase/supabase-js"
import { getSupabaseBrowserEnv, getSupabaseServiceRoleKey } from "./env"

export function createSupabaseAdminClient() {
  const { url } = getSupabaseBrowserEnv()
  const serviceRoleKey = getSupabaseServiceRoleKey()

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
