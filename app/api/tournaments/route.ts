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
    .from("tournaments")
    .select("id, name, format, start_date, end_date, status, organizer_id, rules")
    .order("start_date", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const tournaments = data.map((tournament) => ({
    id: tournament.id,
    name: tournament.name,
    format: tournament.format,
    startDate: tournament.start_date,
    endDate: tournament.end_date,
    status: tournament.status,
    organizerId: tournament.organizer_id || "",
    rules: tournament.rules || undefined,
    teamIds: [],
  }))

  return NextResponse.json({ tournaments })
}
