import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type StandingRow = {
  tournament_id: string
  team_id: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}

function mapStanding(row: StandingRow) {
  return {
    teamId: row.team_id,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goals_for,
    goalsAgainst: row.goals_against,
    goalDifference: row.goal_difference,
    points: row.points,
  }
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Sesion no valida." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tournamentId = searchParams.get("tournamentId")

  const admin = createSupabaseAdminClient()
  let query = admin
    .from("standings")
    .select("tournament_id, team_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points")
    .order("points", { ascending: false })
    .order("goal_difference", { ascending: false })
    .order("goals_for", { ascending: false })

  if (tournamentId) {
    query = query.eq("tournament_id", tournamentId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ standings: (data as StandingRow[]).map(mapStanding) })
}
