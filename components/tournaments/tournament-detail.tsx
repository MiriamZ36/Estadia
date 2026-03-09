"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Plus, Trophy, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Team, Tournament } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressDialog } from "@/components/ui/progress-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AddTeamsDialog } from "./add-teams-dialog"
import { TournamentFixtures } from "./tournament-fixtures"

interface TournamentDetailProps {
  tournament: Tournament
  onBack: () => void
}

type ProgressState = {
  open: boolean
  title: string
  description: string
}

const idleProgress: ProgressState = {
  open: false,
  title: "",
  description: "",
}

export function TournamentDetail({ tournament, onBack }: TournamentDetailProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [isAddTeamsOpen, setIsAddTeamsOpen] = useState(false)
  const [currentTournament] = useState<Tournament>(tournament)
  const [progressState, setProgressState] = useState<ProgressState>(idleProgress)

  useEffect(() => {
    void loadData()
  }, [tournament.id])

  const openProgress = (title: string, description: string) => {
    setProgressState({
      open: true,
      title,
      description,
    })
  }

  const closeProgress = () => {
    setProgressState(idleProgress)
  }

  const loadData = async () => {
    openProgress("Cargando torneo", "Consultando equipos participantes y disponibles.")
    const response = await fetch("/api/teams", {
      cache: "no-store",
    })
    const result = await response.json()
    closeProgress()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible cargar equipos",
        description: result.error || "La informacion del torneo no pudo cargarse.",
      })
      return
    }

    const teamsData = result.teams || []
    setAllTeams(teamsData)
    setTeams(teamsData.filter((team: Team) => team.tournamentId === currentTournament.id))
  }

  const handleAddTeams = async (selectedTeamIds: string[]) => {
    const selectedTeams = allTeams.filter((team) => selectedTeamIds.includes(team.id))

    const responses = await Promise.all(
      selectedTeams.map((team) =>
        fetch(`/api/teams/${team.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...team,
            tournamentId: currentTournament.id,
          }),
        }),
      ),
    )

    const hasError = responses.some((response) => !response.ok)

    if (hasError) {
      toast({
        variant: "destructive",
        title: "No fue posible agregar todos los equipos",
        description: "Algunos equipos no pudieron asignarse al torneo.",
      })
      return
    }

    setIsAddTeamsOpen(false)
    await loadData()

    toast({
      title: "Equipos agregados",
      description: "Los equipos seleccionados fueron asignados al torneo.",
    })
  }

  const canManage = user?.role === "admin"
  const availableTeams = allTeams.filter((team) => team.tournamentId !== currentTournament.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">{currentTournament.name}</h2>
          <p className="text-muted-foreground">
            Futbol {currentTournament.format} • {new Date(currentTournament.startDate).toLocaleDateString("es-MX")} -{" "}
            {new Date(currentTournament.endDate).toLocaleDateString("es-MX")}
          </p>
        </div>
        <Badge variant={currentTournament.status === "active" ? "default" : "secondary"}>
          {currentTournament.status === "active"
            ? "En curso"
            : currentTournament.status === "upcoming"
              ? "Proximo"
              : "Finalizado"}
        </Badge>
      </div>

      <Tabs defaultValue="teams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teams">
            <Users className="mr-2 h-4 w-4" />
            Equipos Participantes
          </TabsTrigger>
          <TabsTrigger value="fixtures">
            <Trophy className="mr-2 h-4 w-4" />
            Encuentros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Equipos ({teams.length})</h3>
              <p className="text-sm text-muted-foreground">Gestiona los equipos que participan en este torneo</p>
            </div>
            {canManage && (
              <Button onClick={() => setIsAddTeamsOpen(true)} disabled={availableTeams.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Equipos
              </Button>
            )}
          </div>

          {teams.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-lg font-medium">No hay equipos registrados</p>
                <p className="mb-4 text-sm text-muted-foreground">Agrega equipos para comenzar el torneo</p>
                {canManage && availableTeams.length > 0 && (
                  <Button onClick={() => setIsAddTeamsOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Equipos
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <Card key={team.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                      {team.logo ? (
                        <img
                          src={team.logo || "/placeholder.svg"}
                          alt={team.name}
                          className="h-full w-full rounded-full object-cover"
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

      <ProgressDialog open={progressState.open} title={progressState.title} description={progressState.description} />
    </div>
  )
}
