import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type RefereeRow = {
  id: string
  name: string
  photo_url: string | null
  license: string
  experience: number
  email: string
  phone: string | null
}

function canManageReferees(role: UserRole) {
  return role === "admin"
}

function formatRefereeError(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes("duplicate key value")) {
    return "Ya existe un arbitro con esta informacion."
  }

  return "No fue posible guardar la informacion del arbitro."
}

async function getSessionProfile() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Sesion no valida.", status: 401 as const }
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single()

  if (error || !profile) {
    return { error: "No se encontro el perfil del usuario autenticado.", status: 403 as const }
  }

  return { userId: user.id, role: profile.role as UserRole }
}

function mapReferee(row: RefereeRow) {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo_url || undefined,
    license: row.license,
    experience: row.experience,
    email: row.email,
    phone: row.phone || undefined,
  }
}

export async function GET() {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("referees")
    .select("id, name, photo_url, license, experience, email, phone")
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ referees: (data as RefereeRow[]).map(mapReferee) })
}

export async function POST(request: Request) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageReferees(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para crear arbitros." }, { status: 403 })
  }

  const body = await request.json()

  if (!body.name || !body.license || typeof body.experience !== "number" || !body.email) {
    return NextResponse.json({ error: "Faltan campos obligatorios del arbitro." }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("referees")
    .insert({
      name: body.name,
      photo_url: body.photo || null,
      license: body.license,
      experience: body.experience,
      email: body.email,
      phone: body.phone || null,
    })
    .select("id, name, photo_url, license, experience, email, phone")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: formatRefereeError(error?.message || "") }, { status: 400 })
  }

  return NextResponse.json({ referee: mapReferee(data as RefereeRow) })
}
