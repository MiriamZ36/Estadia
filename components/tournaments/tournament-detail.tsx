"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { saveTournament, getTeams } from "@/lib/storage"
import type { Tournament, Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Users, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AddTeamsDialog } from "./add-teams-dialog"
import { TournamentFixtures } from "./tournament-fixtures"

interface TournamentDetailProps {
  tournament: Tournament
  onBack: () => void
}

export function TournamentDetail({ tournament, onBack }: TournamentDetailProps) {
  const { user } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [isAddTeamsOpen, setIsAddTeamsOpen] = useState(false)
  const [currentTournament, setCurrentTournament] = useState<Tournament>(tournament)

  useEffect(() => {
    loadData()
  }, [tournament.id])

  const loadData = () => {
    const allTeamsData = getTeams()
    setAllTeams(allTeamsData)

    const tournamentTeams = allTeamsData.filter((team) => currentTournament.teamIds?.includes(team.id))
    setTeams(tournamentTeams)
  }

  const handleAddTeams = (selectedTeamIds: string[]) => {
    const updatedTournament: Tournament = {
      ...currentTournament,
      teamIds: [...new Set([...(currentTournament.teamIds || []), ...selectedTeamIds])],
    }
    saveTournament(updatedTournament)
    setCurrentTournament(updatedTournament)
    setIsAddTeamsOpen(false)
    loadData()
  }

  const handleRemoveTeam = (teamId: string) => {
    if (confirm("¿Deseas remover este equipo del torneo?")) {
      const updatedTournament: Tournament = {
        ...currentTournament,
        teamIds: currentTournament.teamIds?.filter((id) => id !== teamId) || [],
      }
      saveTournament(updatedTournament)
      setCurrentTournament(updatedTournament)
      loadData()
    }
  }

  const canManage = user?.role === "admin"
  const availableTeams = allTeams.filter((team) => !currentTournament.teamIds?.includes(team.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">{currentTournament.name}</h2>
          <p className="text-muted-foreground">
            Fútbol {currentTournament.format} • {new Date(currentTournament.startDate).toLocaleDateString("es-MX")} -{" "}
            {new Date(currentTournament.endDate).toLocaleDateString("es-MX")}
          </p>
        </div>
        <Badge variant={currentTournament.status === "active" ? "default" : "secondary"}>
          {currentTournament.status === "active"
            ? "En curso"
            : currentTournament.status === "upcoming"
              ? "Próximo"
              : "Finalizado"}
        </Badge>
      </div>

      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">
            <Users className="h-4 w-4 mr-2" />
            Equipos Participantes
          </TabsTrigger>
          <TabsTrigger value="fixtures">
            <Trophy className="h-4 w-4 mr-2" />
            Encuentros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Equipos ({teams.length})</h3>
              <p className="text-sm text-muted-foreground">Gestiona los equipos que participan en este torneo</p>
            </div>
            {canManage && (
              <Button onClick={() => setIsAddTeamsOpen(true)} disabled={availableTeams.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Equipos
              </Button>
            )}
          </div>

          {teams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No hay equipos registrados</p>
                <p className="text-sm text-muted-foreground mb-4">Agrega equipos para comenzar el torneo</p>
                {canManage && availableTeams.length > 0 && (
                  <Button onClick={() => setIsAddTeamsOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Equipos
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground">
                      {team.logo ? (
                        <img
                          src={team.logo || "/placeholder.svg"}
                          alt={team.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <Trophy className="h-8 w-8" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      {team.foundedDate && (
                        <CardDescription>Fundado: {new Date(team.foundedDate).getFullYear()}</CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  {canManage && (
                    <CardContent>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveTeam(team.id)} className="w-full">
                        Remover del Torneo
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fixtures">
          <TournamentFixtures tournament={currentTournament} teams={teams} />
        </TabsContent>
      </Tabs>

      <AddTeamsDialog
        open={isAddTeamsOpen}
        onOpenChange={setIsAddTeamsOpen}
        availableTeams={availableTeams}
        onAdd={handleAddTeams}
      />
    </div>
  )
}
