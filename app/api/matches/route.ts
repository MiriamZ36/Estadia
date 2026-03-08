import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type MatchRow = {
  id: string
  tournament_id: string
  home_team_id: string
  away_team_id: string
  match_date: string
  match_time: string
  venue: string
  status: "scheduled" | "live" | "finished"
  home_score: number | null
  away_score: number | null
  referee_id: string | null
}

type TeamRow = {
  id: string
  tournament_id: string | null
}

type TournamentRow = {
  id: string
  status: "upcoming" | "active" | "completed"
  start_date: string
  end_date: string
}

function canManageMatches(role: UserRole) {
  return role === "admin" || role === "referee"
}

function formatMatchError(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes("violates foreign key constraint")) {
    return "La relacion del partido con torneo, equipos o arbitro no es valida."
  }

  if (normalizedMessage.includes("check constraint")) {
    return "Los datos del partido no cumplen con las reglas de validacion."
  }

  return "No fue posible guardar la informacion del partido."
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

function mapMatch(row: MatchRow) {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    date: row.match_date,
    time: row.match_time,
    venue: row.venue,
    status: row.status,
    homeScore: row.home_score ?? undefined,
    awayScore: row.away_score ?? undefined,
    refereeId: row.referee_id ?? undefined,
  }
}

function isDateBetween(targetDate: string, startDate: string, endDate: string) {
  return targetDate >= startDate && targetDate <= endDate
}

async function validateSchedulingRules(admin: ReturnType<typeof createSupabaseAdminClient>, input: {
  homeTeamId: string
  awayTeamId: string
  matchDate: string
  tournamentId?: string
}) {
  if (input.homeTeamId === input.awayTeamId) {
    return { error: "Un equipo no puede jugar contra si mismo.", status: 400 as const }
  }

  const { data: teams, error: teamError } = await admin
    .from("teams")
    .select("id, tournament_id")
    .in("id", [input.homeTeamId, input.awayTeamId])

  if (teamError || !teams || teams.length !== 2) {
    return { error: "Los equipos seleccionados no existen.", status: 400 as const }
  }

  const [homeTeam, awayTeam] = teams as TeamRow[]

  if (!homeTeam.tournament_id || !awayTeam.tournament_id) {
    return { error: "Ambos equipos deben estar asignados a un torneo.", status: 400 as const }
  }

  if (homeTeam.tournament_id !== awayTeam.tournament_id) {
    return { error: "Los equipos deben pertenecer al mismo torneo.", status: 400 as const }
  }

  if (input.tournamentId && input.tournamentId !== homeTeam.tournament_id) {
    return { error: "El torneo del partido no coincide con el torneo de los equipos.", status: 400 as const }
  }

  const { data: tournament, error: tournamentError } = await admin
    .from("tournaments")
    .select("id, status, start_date, end_date")
    .eq("id", homeTeam.tournament_id)
    .single()

  if (tournamentError || !tournament) {
    return { error: "No se encontro el torneo relacionado al partido.", status: 400 as const }
  }

  const typedTournament = tournament as TournamentRow

  if (!["upcoming", "active"].includes(typedTournament.status)) {
    return { error: "Solo puedes programar partidos en torneos proximos o en curso.", status: 400 as const }
  }

  if (!isDateBetween(input.matchDate, typedTournament.start_date, typedTournament.end_date)) {
    return {
      error: "La fecha del partido debe estar dentro del rango de fechas del torneo.",
      status: 400 as const,
    }
  }

  return { tournamentId: typedTournament.id }
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
    .from("matches")
    .select("id, tournament_id, home_team_id, away_team_id, match_date, match_time, venue, status, home_score, away_score, referee_id")
    .order("match_date", { ascending: true })
    .order("match_time", { ascending: true })

  if (tournamentId) {
    query = query.eq("tournament_id", tournamentId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ matches: (data as MatchRow[]).map(mapMatch) })
}

export async function POST(request: Request) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageMatches(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para crear partidos." }, { status: 403 })
  }

  const body = await request.json()

  if (!body.homeTeamId || !body.awayTeamId || !body.date || !body.time || !body.venue) {
    return NextResponse.json({ error: "Faltan campos obligatorios del partido." }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const validation = await validateSchedulingRules(admin, {
    homeTeamId: body.homeTeamId,
    awayTeamId: body.awayTeamId,
    matchDate: body.date,
    tournamentId: body.tournamentId || undefined,
  })

  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: validation.status })
  }

  const { data, error } = await admin
    .from("matches")
    .insert({
      tournament_id: validation.tournamentId,
      home_team_id: body.homeTeamId,
      away_team_id: body.awayTeamId,
      match_date: body.date,
      match_time: body.time,
      venue: body.venue,
      status: body.status || "scheduled",
      home_score: body.homeScore ?? null,
      away_score: body.awayScore ?? null,
      referee_id: body.refereeId || null,
    })
    .select("id, tournament_id, home_team_id, away_team_id, match_date, match_time, venue, status, home_score, away_score, referee_id")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: formatMatchError(error?.message || "") }, { status: 400 })
  }

  return NextResponse.json({ match: mapMatch(data as MatchRow) })
}
