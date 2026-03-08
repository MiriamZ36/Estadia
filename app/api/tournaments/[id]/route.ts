import { NextResponse } from "next/server"
import type { UserRole } from "@/lib/types"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function canManageTournaments(role: UserRole) {
  return role === "admin"
}

function formatTournamentError(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes("violates check constraint")) {
    return "Alguno de los valores del torneo no cumple las reglas definidas."
  }

  return "No fue posible actualizar el torneo."
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

function mapTournament(row: {
  id: string
  name: string
  format: "5" | "7" | "11"
  start_date: string
  end_date: string
  status: "upcoming" | "active" | "completed"
  organizer_id: string | null
  rules: string | null
}) {
  return {
    id: row.id,
    name: row.name,
    format: row.format,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    organizerId: row.organizer_id || "",
    rules: row.rules || undefined,
    teamIds: [],
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageTournaments(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para editar torneos." }, { status: 403 })
  }

  const { id } = await context.params
  const body = await request.json()
  const admin = createSupabaseAdminClient()

  const { data, error } = await admin
    .from("tournaments")
    .update({
      name: body.name,
      format: body.format,
      start_date: body.startDate,
      end_date: body.endDate,
      status: body.status,
      organizer_id: body.organizerId || guard.userId,
      rules: body.rules || null,
    })
    .eq("id", id)
    .select("id, name, format, start_date, end_date, status, organizer_id, rules")
    .single()

  if (error || !data) {
    return NextResponse.json({ error: formatTournamentError(error?.message || "") }, { status: 400 })
  }

  return NextResponse.json({ tournament: mapTournament(data) })
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await getSessionProfile()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  if (!canManageTournaments(guard.role)) {
    return NextResponse.json({ error: "No tienes permisos para eliminar torneos." }, { status: 403 })
  }

  const { id } = await context.params
  const admin = createSupabaseAdminClient()
  const { error } = await admin.from("tournaments").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: "No fue posible eliminar el torneo." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
