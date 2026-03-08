import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function canManageTeams(role: UserRole) {
  return role === "admin" || role === "coach"
}

function formatTeamError(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes("duplicate key value")) {
    return "Ya existe un equipo con ese nombre dentro del torneo."
  }

  if (normalizedMessage.includes("violates foreign key constraint")) {
    return "La relacion del equipo con el torneo no es valida."
  }

  return "No fue posible actualizar el equipo."
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

function mapTeam(row: {
  id: string
  name: string
  tournament_id: string | null
  logo_url: string | null
  founded_date: string | null
  coach_id: string | null
}) {
  return {
    id: row.id,
    name: row.name,
    tournamentId: row.tournament_id || "",
    logo: row.logo_url || undefined,
    foundedDate: row.founded_date || undefined,
    coachId: row.coach_id || undefined,
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageTeams(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para editar equipos." }, { status: 403 })
  }

  const { id } = await context.params
  const body = await request.json()
  const admin = createSupabaseAdminClient()

  const { data, error } = await admin
    .from("teams")
    .update({
      name: body.name,
      tournament_id: body.tournamentId,
      logo_url: body.logo || null,
      founded_date: body.foundedDate || null,
      coach_id: body.coachId || null,
    })
    .eq("id", id)
    .select("id, name, tournament_id, logo_url, founded_date, coach_id")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: formatTeamError(error?.message || "") }, { status: 400 })
  }

  return NextResponse.json({ team: mapTeam(data) })
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageTeams(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para eliminar equipos." }, { status: 403 })
  }

  const { id } = await context.params
  const admin = createSupabaseAdminClient()
  const { error } = await admin.from("teams").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: "No fue posible eliminar el equipo." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
