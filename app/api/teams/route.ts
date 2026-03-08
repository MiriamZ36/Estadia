import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Sesion no valida.", status: 401 as const }
  }

  return { userId: user.id }
}

export async function GET() {
  const guard = await requireAuthenticatedUser()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin
    .from("teams")
    .select("id, name, tournament_id, logo_url, founded_date, coach_id")
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const teams = data.map((team) => ({
    id: team.id,
    name: team.name,
    tournamentId: team.tournament_id,
    logo: team.logo_url || undefined,
    foundedDate: team.founded_date || undefined,
    coachId: team.coach_id || undefined,
  }))

  return NextResponse.json({ teams })
}
