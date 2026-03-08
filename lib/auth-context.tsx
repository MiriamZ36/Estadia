"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { AuthChangeEvent, Session, SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User, UserRole } from "./types"

type AuthActionResult = {
  success: boolean
  error?: string
  message?: string
}

interface UpdateProfileInput {
  name: string
  email: string
  photo?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<AuthActionResult>
  register: (name: string, email: string, password: string, role: User["role"]) => Promise<AuthActionResult>
  updateProfile: (data: UpdateProfileInput) => Promise<AuthActionResult>
  logout: () => Promise<void>
  isLoading: boolean
}

interface ProfileRow {
  id: string
  name: string
  role: UserRole
  photo_url: string | null
  created_at: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes("invalid login credentials")) {
    return "Correo o contrasena incorrectos."
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Debes confirmar tu correo antes de iniciar sesion."
  }

  if (normalizedMessage.includes("user already registered")) {
    return "Ya existe un usuario registrado con ese correo."
  }

  return "No fue posible completar la operacion de autenticacion."
}

function mapProfileToUser(profile: ProfileRow, authUser: SupabaseUser): User {
  return {
    id: profile.id,
    email: authUser.email ?? "",
    name: profile.name,
    role: profile.role,
    createdAt: profile.created_at || authUser.created_at,
    photo: profile.photo_url || undefined,
  }
}

async function fetchProfile(
  supabase: SupabaseClient,
  authUser: SupabaseUser,
): Promise<{ user: User | null; error?: string }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, role, photo_url, created_at")
    .eq("id", authUser.id)
    .single()

  if (error || !data) {
    return {
      user: null,
      error: "Tu cuenta existe en Auth, pero no tiene perfil activo en FutPro.",
    }
  }

  return {
    user: mapProfileToUser(data as ProfileRow, authUser),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [supabase] = useState(() => createSupabaseBrowserClient())

  useEffect(() => {
    let isMounted = true

    const syncSession = async (session: Session | null) => {
      if (!isMounted) return

      if (!session?.user) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const profileResult = await fetchProfile(supabase, session.user)

      if (!isMounted) return

      setUser(profileResult.user)
      setIsLoading(false)
    }

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      await syncSession(session)
    }

    void initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session) => {
      void syncSession(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    setIsLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      setIsLoading(false)
      return {
        success: false,
        error: getAuthErrorMessage(error?.message || ""),
      }
    }

    const profileResult = await fetchProfile(supabase, data.user)

    if (!profileResult.user) {
      await supabase.auth.signOut()
      setIsLoading(false)
      return {
        success: false,
        error: profileResult.error,
      }
    }

    setUser(profileResult.user)
    setIsLoading(false)

    return {
      success: true,
      message: `Bienvenido, ${profileResult.user.name}.`,
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    role: User["role"],
  ): Promise<AuthActionResult> => {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "No fue posible crear el usuario.",
      }
    }

    return {
      success: true,
      message: "Usuario creado correctamente.",
    }
  }

  const updateProfile = async ({ name, email, photo }: UpdateProfileInput): Promise<AuthActionResult> => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return {
        success: false,
        error: "No hay una sesion activa.",
      }
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name,
        photo_url: photo || null,
      })
      .eq("id", authUser.id)

    if (profileError) {
      return {
        success: false,
        error: "No fue posible actualizar el perfil.",
      }
    }

    let message = "Perfil actualizado correctamente."

    if (email !== authUser.email) {
      const { error: authError } = await supabase.auth.updateUser({ email })

      if (authError) {
        return {
          success: false,
          error: "El perfil se actualizo, pero no fue posible cambiar el correo.",
        }
      }

      message = "Perfil actualizado. Revisa tu correo para confirmar el cambio de email."
    }

    const refreshedProfile = await fetchProfile(supabase, {
      ...authUser,
      email,
    } as SupabaseUser)

    if (refreshedProfile.user) {
      setUser(refreshedProfile.user)
    }

    return {
      success: true,
      message,
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, updateProfile, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
