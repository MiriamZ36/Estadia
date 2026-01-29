"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/auth/login-form"
import { Sidebar } from "@/components/sidebar"
import { TournamentList } from "@/components/tournaments/tournament-list"
import { TeamList } from "@/components/teams/team-list"
import { MatchList } from "@/components/matches/match-list"
import { StatisticsView } from "@/components/stats/statistics-view"
import { UserManagement } from "@/components/users/user-management"
import { RefereeList } from "@/components/referees/referee-list"
import { CoachList } from "@/components/coaches/coach-list"
import { AllPlayersList } from "@/components/players/all-players-list"
import { UserProfile } from "@/components/profile/user-profile"
import { Card } from "@/components/ui/card"
import { initializeSampleData } from "@/lib/sample-data"
import { cn } from "@/lib/utils"

export default function Home() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("tournaments")
  const [isInstalled, setIsInstalled] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
    }
    initializeSampleData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-800 dark:text-green-400 mb-2">Torneo Fut</h1>
            <p className="text-muted-foreground">Sistema Inteligente de Gestión Deportiva Amateur</p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <main className={cn("p-4 md:p-8 transition-all duration-300", isCollapsed ? "md:ml-16" : "md:ml-64")}>
        <div className="max-w-7xl mx-auto mt-12 md:mt-0">
          {!isInstalled && (
            <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Instala Torneo Fut como aplicación para acceso rápido y experiencia mejorada.
              </p>
            </Card>
          )}

          {activeTab === "tournaments" && <TournamentList />}
          {activeTab === "teams" && <TeamList />}
          {activeTab === "players" && <AllPlayersList />}
          {activeTab === "coaches" && <CoachList />}
          {activeTab === "referees" && <RefereeList />}
          {activeTab === "matches" && <MatchList />}
          {activeTab === "stats" && <StatisticsView />}
          {activeTab === "profile" && <UserProfile />}
          {activeTab === "users" && <UserManagement />}
        </div>
      </main>
    </div>
  )
}
