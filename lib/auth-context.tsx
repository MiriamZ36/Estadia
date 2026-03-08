"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, role: User["role"]) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const initializeDefaultUsers = () => {
  const users = localStorage.getItem("futpro_users")
  if (!users) {
    const defaultUsers = [
      {
        id: "1",
        name: "Admin",
        email: "admin@torneofut.com",
        password: "admin123",
        role: "admin" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Árbitro Demo",
        email: "arbitro@torneofut.com",
        password: "arbitro123",
        role: "referee" as const,
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Entrenador Demo",
        email: "entrenador@torneofut.com",
        password: "entrenador123",
        role: "coach" as const,
        createdAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem("futpro_users", JSON.stringify(defaultUsers))
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    initializeDefaultUsers()

    const storedUser = localStorage.getItem("futpro_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem("futpro_users") || "[]")
    const foundUser = users.find((u: User & { password: string }) => u.email === email && u.password === password)

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem("futpro_user", JSON.stringify(userWithoutPassword))
      return true
    }
    return false
  }

  const register = async (name: string, email: string, password: string, role: User["role"]): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem("futpro_users") || "[]")

    if (users.find((u: User) => u.email === email)) {
      return false
    }

    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      name,
      email,
      role,
      password,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem("futpro_users", JSON.stringify(users))

    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem("futpro_user", JSON.stringify(userWithoutPassword))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("futpro_user")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
