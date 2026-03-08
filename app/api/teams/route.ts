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
    return "El torneo seleccionado no existe o no es valido."
  }

  return "No fue posible guardar el equipo."
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

export async function GET(request: Request) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const { searchParams } = new URL(request.url)
  const tournamentId = searchParams.get("tournamentId")

  const admin = createSupabaseAdminClient()
  let query = admin
    .from("teams")
    .select("id, name, tournament_id, logo_url, founded_date, coach_id")
    .order("name", { ascending: true })

  if (tournamentId) {
    query = query.eq("tournament_id", tournamentId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ teams: data.map(mapTeam) })
}

export async function POST(request: Request) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageTeams(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para crear equipos." }, { status: 403 })
  }

  const body = await request.json()

  if (!body.name) {
    return NextResponse.json({ error: "Faltan campos obligatorios del equipo." }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("teams")
    .insert({
      name: body.name,
      tournament_id: body.tournamentId || null,
      logo_url: body.logo || null,
      founded_date: body.foundedDate || null,
      coach_id: body.coachId || null,
    })
    .select("id, name, tournament_id, logo_url, founded_date, coach_id")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: formatTeamError(error?.message || "") }, { status: 400 })
  }

  return NextResponse.json({ team: mapTeam(data) })
}
