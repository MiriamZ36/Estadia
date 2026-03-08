"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Trophy, Users, Calendar, BarChart3, TrophyIcon, UserCog } from "lucide-react"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { user, logout } = useAuth()

  return (
    <div className="border-b bg-background">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-6 w-6 text-green-600" />
          <h1 className="text-xl font-bold">FutPro</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {user?.name} (
            {user?.role === "admin"
              ? "Admin"
              : user?.role === "referee"
                ? "Árbitro"
                : user?.role === "coach"
                  ? "Entrenador"
                  : "Aficionado"}
            )
          </span>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </div>
      <div className="px-4 pb-4">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className={`grid w-full ${user?.role === "admin" ? "grid-cols-5" : "grid-cols-4"}`}>
            <TabsTrigger value="tournaments" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Torneos</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Equipos</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Partidos</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Estadísticas</span>
            </TabsTrigger>
            {user?.role === "admin" && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Usuarios</span>
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
