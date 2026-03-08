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

  return "No fue posible actualizar el partido."
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageMatches(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para editar partidos." }, { status: 403 })
  }

  const { id } = await context.params
  const body = await request.json()
  const admin = createSupabaseAdminClient()

  const { data: existingMatch, error: existingError } = await admin
    .from("matches")
    .select("id, tournament_id, home_team_id, away_team_id, match_date, match_time, venue, status, home_score, away_score, referee_id")
    .eq("id", id)
    .single()

  if (existingError || !existingMatch) {
    return NextResponse.json({ error: "No se encontro el partido a actualizar." }, { status: 404 })
  }

  const merged = {
    tournamentId: body.tournamentId || (existingMatch as MatchRow).tournament_id,
    homeTeamId: body.homeTeamId || (existingMatch as MatchRow).home_team_id,
    awayTeamId: body.awayTeamId || (existingMatch as MatchRow).away_team_id,
    date: body.date || (existingMatch as MatchRow).match_date,
    time: body.time || (existingMatch as MatchRow).match_time,
    venue: body.venue || (existingMatch as MatchRow).venue,
    status: body.status || (existingMatch as MatchRow).status,
    homeScore: body.homeScore ?? (existingMatch as MatchRow).home_score,
    awayScore: body.awayScore ?? (existingMatch as MatchRow).away_score,
    refereeId: body.refereeId ?? (existingMatch as MatchRow).referee_id,
  }

  const validation = await validateSchedulingRules(admin, {
    homeTeamId: merged.homeTeamId,
    awayTeamId: merged.awayTeamId,
    matchDate: merged.date,
    tournamentId: merged.tournamentId,
  })

  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: validation.status })
  }

  const { data, error } = await admin
    .from("matches")
    .update({
      tournament_id: validation.tournamentId,
      home_team_id: merged.homeTeamId,
      away_team_id: merged.awayTeamId,
      match_date: merged.date,
      match_time: merged.time,
      venue: merged.venue,
      status: merged.status,
      home_score: merged.homeScore ?? null,
      away_score: merged.awayScore ?? null,
      referee_id: merged.refereeId || null,
    })
    .eq("id", id)
    .select("id, tournament_id, home_team_id, away_team_id, match_date, match_time, venue, status, home_score, away_score, referee_id")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: formatMatchError(error?.message || "") }, { status: 400 })
  }

  return NextResponse.json({ match: mapMatch(data as MatchRow) })
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageMatches(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para eliminar partidos." }, { status: 403 })
  }

  const { id } = await context.params
  const admin = createSupabaseAdminClient()
  const { error } = await admin.from("matches").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: "No fue posible eliminar el partido." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
