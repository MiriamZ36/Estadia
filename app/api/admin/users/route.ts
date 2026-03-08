import { NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Sesion no valida.", status: 401 as const }
  }

  const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (error || !profile || profile.role !== "admin") {
    return { error: "Acceso denegado.", status: 403 as const }
  }

  return { userId: user.id }
}

export async function GET() {
  const guard = await requireAdmin()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const admin = createSupabaseAdminClient()
  const {
    data: { users },
    error: usersError,
  } = await admin.auth.admin.listUsers()

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const userIds = users.map((user) => user.id)
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, name, role, photo_url, created_at")
    .in("id", userIds)

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))

  const result = users.map((authUser) => {
    const profile = profilesById.get(authUser.id)

    return {
      id: authUser.id,
      email: authUser.email || "",
      name: profile?.name || authUser.user_metadata?.name || "Usuario sin perfil",
      role: profile?.role || "fan",
      photo: profile?.photo_url || undefined,
      createdAt: profile?.created_at || authUser.created_at,
    }
  })

  return NextResponse.json({ users: result })
}

export async function POST(request: Request) {
  const guard = await requireAdmin()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const body = await request.json()
  const { name, email, password, role } = body

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role,
    },
  })

  if (createError || !createdUser.user) {
    return NextResponse.json({ error: createError?.message || "No fue posible crear el usuario." }, { status: 400 })
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: createdUser.user.id,
    name,
    role,
    photo_url: null,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(createdUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({
    user: {
      id: createdUser.user.id,
      email: createdUser.user.email || "",
      name,
      role,
      createdAt: createdUser.user.created_at,
    },
  })
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const body = await request.json()
  const userId = body.id

  if (!userId) {
    return NextResponse.json({ error: "Falta el identificador del usuario." }, { status: 400 })
  }

  if (userId === guard.userId) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta." }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
