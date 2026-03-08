import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type MatchEventRow = {
  id: string
  match_id: string
  type: "goal" | "yellow_card" | "red_card" | "substitution"
  player_id: string
  team_id: string
  minute: number
  description: string | null
  created_at: string
}

function canManageMatchEvents(role: UserRole) {
  return role === "admin" || role === "referee"
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

function mapEvent(row: MatchEventRow) {
  return {
    id: row.id,
    matchId: row.match_id,
    type: row.type,
    playerId: row.player_id,
    teamId: row.team_id,
    minute: row.minute,
    description: row.description || undefined,
  }
}

export async function GET(request: Request) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get("matchId")

  if (!matchId) {
    return NextResponse.json({ error: "Falta el parametro matchId." }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("match_events")
    .select("id, match_id, type, player_id, team_id, minute, description, created_at")
    .eq("match_id", matchId)
    .order("minute", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: (data as MatchEventRow[]).map(mapEvent) })
}

export async function POST(request: Request) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageMatchEvents(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para registrar eventos del partido." }, { status: 403 })
  }

  const body = await request.json()

  if (!body.matchId || !body.type || !body.playerId || !body.teamId || typeof body.minute !== "number") {
    return NextResponse.json({ error: "Faltan campos obligatorios del evento." }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("match_events")
    .insert({
      match_id: body.matchId,
      type: body.type,
      player_id: body.playerId,
      team_id: body.teamId,
      minute: body.minute,
      description: body.description || null,
    })
    .select("id, match_id, type, player_id, team_id, minute, description, created_at")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "No fue posible registrar el evento del partido." }, { status: 400 })
  }

  return NextResponse.json({ event: mapEvent(data as MatchEventRow) })
}
