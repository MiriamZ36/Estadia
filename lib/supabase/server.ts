import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseBrowserEnv } from "./env"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseBrowserEnv()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })
}
