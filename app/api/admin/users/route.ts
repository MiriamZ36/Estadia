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

export async function PATCH(request: Request) {
  const guard = await requireAdmin()

  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status })
  }

  const body = await request.json()
  const { id, name, email, role, password } = body as {
    id?: string
    name?: string
    email?: string
    role?: "admin" | "referee" | "coach" | "fan"
    password?: string
  }

  if (!id || !name || !email || !role) {
    return NextResponse.json({ error: "Faltan datos requeridos para actualizar el usuario." }, { status: 400 })
  }

  if (id === guard.userId && role !== "admin") {
    return NextResponse.json({ error: "No puedes quitarte el rol de administrador." }, { status: 400 })
  }

  if (password && String(password).length < 6) {
    return NextResponse.json({ error: "La contrasena debe tener al menos 6 caracteres." }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  const { data: existingAuth, error: existingAuthError } = await admin.auth.admin.getUserById(id)

  if (existingAuthError || !existingAuth.user) {
    return NextResponse.json({ error: "No se encontro el usuario en Auth." }, { status: 404 })
  }

  const updates: {
    email: string
    user_metadata: { name: string; role: string }
    password?: string
  } = {
    email,
    user_metadata: {
      name,
      role,
    },
  }

  if (password) {
    updates.password = password
  }

  const { error: updateAuthError } = await admin.auth.admin.updateUserById(id, updates)
  if (updateAuthError) {
    return NextResponse.json({ error: updateAuthError.message }, { status: 400 })
  }

  const { error: updateProfileError } = await admin
    .from("profiles")
    .update({
      name,
      role,
    })
    .eq("id", id)

  if (updateProfileError) {
    return NextResponse.json({ error: updateProfileError.message }, { status: 500 })
  }

  return NextResponse.json({
    user: {
      id,
      name,
      email,
      role,
      createdAt: existingAuth.user.created_at,
    },
  })
}
