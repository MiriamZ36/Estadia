import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function formatPlayerError(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes("duplicate key value")) {
    return "Ya existe un jugador con ese numero dentro del equipo."
  }

  if (normalizedMessage.includes("violates foreign key constraint")) {
    return "El equipo seleccionado no existe o no es valido."
  }

  return "No fue posible guardar la informacion del jugador."
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

function canManagePlayers(role: UserRole) {
  return role === "admin" || role === "coach"
}

function mapPlayer(row: {
  id: string
  team_id: string
  name: string
  position: string
  number: number
  photo_url: string | null
  birth_date: string | null
  nationality: string | null
  height_cm: number | null
  weight_kg: number | null
  dominant_foot: "left" | "right" | "both" | null
  email: string | null
  phone: string | null
  emergency_contact: string | null
  blood_type: string | null
  medical_notes: string | null
}) {
  return {
    id: row.id,
    teamId: row.team_id,
    name: row.name,
    position: row.position,
    number: row.number,
    photo: row.photo_url || undefined,
    birthDate: row.birth_date || undefined,
    nationality: row.nationality || undefined,
    height: row.height_cm || undefined,
    weight: row.weight_kg || undefined,
    dominantFoot: row.dominant_foot || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    emergencyContact: row.emergency_contact || undefined,
    bloodType: row.blood_type || undefined,
    medicalNotes: row.medical_notes || undefined,
  }
}

export async function GET(request: Request) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get("teamId")
  const unassigned = searchParams.get("unassigned")

  const admin = createSupabaseAdminClient()
  let query = admin
    .from("players")
    .select(
      "id, team_id, name, position, number, photo_url, birth_date, nationality, height_cm, weight_kg, dominant_foot, email, phone, emergency_contact, blood_type, medical_notes",
    )
    .order("name", { ascending: true })

  if (teamId) {
    query = query.eq("team_id", teamId)
  }

  if (unassigned === "true") {
    query = query.is("team_id", null)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ players: data.map(mapPlayer) })
}

export async function POST(request: Request) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManagePlayers(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para crear jugadores." }, { status: 403 })
  }

  const body = await request.json()

  if (!body.name || !body.teamId || !body.position || !body.number) {
    return NextResponse.json({ error: "Faltan campos obligatorios del jugador." }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("players")
    .insert({
      team_id: body.teamId,
      name: body.name,
      position: body.position,
      number: body.number,
      photo_url: body.photo || null,
      birth_date: body.birthDate || null,
      nationality: body.nationality || null,
      height_cm: body.height || null,
      weight_kg: body.weight || null,
      dominant_foot: body.dominantFoot || null,
      email: body.email || null,
      phone: body.phone || null,
      emergency_contact: body.emergencyContact || null,
      blood_type: body.bloodType || null,
      medical_notes: body.medicalNotes || null,
    })
    .select(
      "id, team_id, name, position, number, photo_url, birth_date, nationality, height_cm, weight_kg, dominant_foot, email, phone, emergency_contact, blood_type, medical_notes",
    )
    .single()

  if (error || !data) {
    return NextResponse.json({ error: formatPlayerError(error?.message || "") }, { status: 400 })
  }

  return NextResponse.json({ player: mapPlayer(data) })
}
