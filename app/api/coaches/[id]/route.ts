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

  return "No fue posible actualizar el entrenador."
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageCoaches(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para editar entrenadores." }, { status: 403 })
  }

  const { id } = await context.params
  const body = await request.json()
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("coaches")
    .update({
      name: body.name,
      photo_url: body.photo || null,
      license: body.license || null,
      experience: body.experience,
      email: body.email,
      phone: body.phone || null,
      specialty: body.specialty || null,
    })
    .eq("id", id)
    .select("id, name, photo_url, license, experience, email, phone, specialty")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: formatCoachError(error?.message || "") }, { status: 400 })
  }

  try {
    const assignedTeam = await assignCoachToTeam(admin, id, body.teamId || undefined)
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

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageCoaches(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para eliminar entrenadores." }, { status: 403 })
  }

  const { id } = await context.params
  const admin = createSupabaseAdminClient()
  const { error } = await admin.from("coaches").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: "No fue posible eliminar el entrenador." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
