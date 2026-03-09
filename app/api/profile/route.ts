import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type ProfileRow = {
  id: string
  name: string
  role: UserRole
  photo_url: string | null
  created_at: string
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Sesion no valida." }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, role, photo_url, created_at")
    .eq("id", user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: "No se encontro el perfil del usuario autenticado." }, { status: 404 })
  }

  const typedProfile = profile as ProfileRow

  return NextResponse.json({
    user: {
      id: typedProfile.id,
      name: typedProfile.name,
      email: user.email || "",
      role: typedProfile.role,
      photo: typedProfile.photo_url || undefined,
      createdAt: typedProfile.created_at || user.created_at,
    },
  })
}
