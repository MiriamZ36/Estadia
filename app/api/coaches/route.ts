import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type CoachRow = {
  id: string
  name: string
  photo_url: string | null
  license: string | null
  experience: number
  email: string
  phone: string | null
  specialty: string | null
}

type TeamCoachRow = {
  id: string
  name: string
  coach_id: string | null
}

function canManageCoaches(role: UserRole) {
  return role === "admin"
}

function formatCoachError(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes("duplicate key value")) {
    return "Ya existe un entrenador con esta informacion."
  }

  if (normalizedMessage.includes("violates foreign key constraint")) {
    return "La relacion del entrenador con el equipo no es valida."
  }

  return "No fue posible guardar la informacion del entrenador."
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

function mapCoach(row: CoachRow, team?: { id: string; name: string }) {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo_url || undefined,
    license: row.license || undefined,
    experience: row.experience,
    email: row.email,
    phone: row.phone || undefined,
    specialty: row.specialty || undefined,
    teamId: team?.id,
    teamName: team?.name,
  }
}

async function assignCoachToTeam(admin: ReturnType<typeof createSupabaseAdminClient>, coachId: string, teamId?: string) {
  const { error: clearError } = await admin.from("teams").update({ coach_id: null }).eq("coach_id", coachId)

  if (clearError) {
    throw new Error("No fue posible limpiar la asignacion previa del entrenador.")
  }

  if (!teamId) {
    return undefined
  }

  const { data: assignedTeam, error: assignError } = await admin
    .from("teams")
    .update({ coach_id: coachId })
    .eq("id", teamId)
    .select("id, name")
    .single()

  if (assignError || !assignedTeam) {
    throw new Error("No fue posible asignar el entrenador al equipo seleccionado.")
  }

  return assignedTeam
}

export async function GET() {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const admin = createSupabaseAdminClient()
  const { data: coaches, error: coachesError } = await admin
    .from("coaches")
    .select("id, name, photo_url, license, experience, email, phone, specialty")
    .order("name", { ascending: true })

  if (coachesError) {
    return NextResponse.json({ error: coachesError.message }, { status: 500 })
  }

  const { data: teams, error: teamsError } = await admin.from("teams").select("id, name, coach_id").not("coach_id", "is", null)

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 })
  }

  const teamByCoach = new Map<string, { id: string; name: string }>()
  ;(teams as TeamCoachRow[]).forEach((team) => {
    if (team.coach_id && !teamByCoach.has(team.coach_id)) {
      teamByCoach.set(team.coach_id, { id: team.id, name: team.name })
    }
  })

  return NextResponse.json({
    coaches: (coaches as CoachRow[]).map((coach) => mapCoach(coach, teamByCoach.get(coach.id))),
  })
}

export async function POST(request: Request) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageCoaches(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para crear entrenadores." }, { status: 403 })
  }

  const body = await request.json()

  if (!body.name || typeof body.experience !== "number" || !body.email) {
    return NextResponse.json({ error: "Faltan campos obligatorios del entrenador." }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("coaches")
    .insert({
      name: body.name,
      photo_url: body.photo || null,
      license: body.license || null,
      experience: body.experience,
      email: body.email,
      phone: body.phone || null,
      specialty: body.specialty || null,
    })
    .select("id, name, photo_url, license, experience, email, phone, specialty")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: formatCoachError(error?.message || "") }, { status: 400 })
  }

  try {
    const assignedTeam = await assignCoachToTeam(admin, data.id, body.teamId || undefined)
    return NextResponse.json({ coach: mapCoach(data as CoachRow, assignedTeam || undefined) })
  } catch (assignmentError) {
    return NextResponse.json(
      {
        error: assignmentError instanceof Error ? assignmentError.message : "No fue posible asignar el entrenador al equipo.",
      },
      { status: 400 },
    )
  }
}
