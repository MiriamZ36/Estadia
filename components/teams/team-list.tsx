"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useLoading } from "@/lib/loading-context"
import { getTournaments, getTeams, saveTeam, deleteTeam, getPlayers } from "@/lib/storage"
import type { Tournament, Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, UsersIcon, Pencil, Trash2, User } from "lucide-react"
import { TeamDialog } from "./team-dialog"
import { PlayerList } from "./player-list"

export function TeamList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { startLoading, stopLoading } = useLoading()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>("")
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const tournamentsData = getTournaments()
    setTournaments(tournamentsData)
    if (tournamentsData.length > 0 && !selectedTournament) {
      setSelectedTournament(tournamentsData[0].id)
    }
  }, [])

  useEffect(() => {
    if (selectedTournament) {
      loadTeams()
    }
  }, [selectedTournament])

  const loadTeams = () => {
    if (selectedTournament) {
      const data = getTeams(selectedTournament)
      setTeams(data)
    }
  }

  const handleSave = (team: Team) => {
    try {
      startLoading(team.id ? "Actualizando equipo..." : "Creando equipo...")
      saveTeam(team)
      loadTeams()
      setIsDialogOpen(false)
      setSelectedTeam(null)
      toast({
        title: team.id ? "Equipo actualizado" : "Equipo creado",
        description: `${team.name} ha sido ${team.id ? "actualizado" : "creado"} exitosamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el equipo.",
        variant: "destructive",
      })
    } finally {
      stopLoading()
    }
  }

  const handleEdit = (team: Team) => {
    setSelectedTeam(team)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const team = teams.find((t) => t.id === id)
    if (confirm("¿Estás seguro de eliminar este equipo? Se eliminarán también todos sus jugadores.")) {
      try {
        startLoading("Eliminando equipo...")
        deleteTeam(id)
        loadTeams()
        toast({
          title: "Equipo eliminado",
          description: `${team?.name || "El equipo"} ha sido eliminado exitosamente.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Ocurrió un error al eliminar el equipo.",
          variant: "destructive",
        })
      } finally {
        stopLoading()
      }
    }
  }

  const handleCreate = () => {
    setSelectedTeam(null)
    setIsDialogOpen(true)
  }

  const getPlayerCount = (teamId: string) => {
    return getPlayers(teamId).length
  }

  const canManage = user?.role === "admin" || user?.role === "coach"

  if (viewingTeamId) {
    const team = teams.find((t) => t.id === viewingTeamId)
    if (team) {
      return <PlayerList team={team} onBack={() => setViewingTeamId(null)} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Equipos y Jugadores</h2>
          <p className="text-muted-foreground">Gestiona los equipos y sus plantillas</p>
        </div>
        {canManage && selectedTournament && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Equipo
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un torneo" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name} - Fútbol {tournament.format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedTournament ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Selecciona un torneo para ver los equipos</p>
          </CardContent>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay equipos registrados</p>
            <p className="text-sm text-muted-foreground mb-4">Comienza agregando tu primer equipo</p>
            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Equipo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{team.name}</CardTitle>
                    <CardDescription className="mt-2 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {getPlayerCount(team.id)} jugadores
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewingTeamId(team.id)} className="flex-1">
                    <UsersIcon className="h-4 w-4 mr-2" />
                    Ver Plantilla
                  </Button>
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(team)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(team.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TeamDialog
        team={selectedTeam}
        tournamentId={selectedTournament}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />
    </div>
  )
}
