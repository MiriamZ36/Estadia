"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, User, UsersIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Player, Tournament, Team } from "@/lib/types"
import { PlayerList } from "./player-list"
import { TeamDialog } from "./team-dialog"
import { ProgressDialog } from "@/components/ui/progress-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export function TeamList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>("")
  const [teams, setTeams] = useState<Team[]>([])
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({})
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progressState, setProgressState] = useState<ProgressState>(idleProgress)

  useEffect(() => {
    void loadTournaments()
  }, [])

  useEffect(() => {
    if (selectedTournament) {
      void loadTeams(selectedTournament)
      void loadPlayerCounts()
    } else {
      void loadTeams()
      void loadPlayerCounts()
    }
  }, [selectedTournament])

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

  const loadTournaments = async () => {
    const response = await fetch("/api/tournaments", {
      cache: "no-store",
    })
    const result = await response.json()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible cargar torneos",
        description: result.error || "Verifica la conexion con Supabase.",
      })
      return
    }

    const mappedTournaments: Tournament[] = result.tournaments || []
    setTournaments(mappedTournaments)

    if (mappedTournaments.length > 0 && !selectedTournament) {
      setSelectedTournament(mappedTournaments[0].id)
    }
  }

  const loadTeams = async (tournamentId?: string) => {
    const endpoint = tournamentId ? `/api/teams?tournamentId=${tournamentId}` : "/api/teams"
    const response = await fetch(endpoint, {
      cache: "no-store",
    })
    const result = await response.json()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible cargar equipos",
        description: result.error || "No se pudo recuperar la lista de equipos.",
      })
      return
    }

    setTeams(result.teams || [])
  }

  const loadPlayerCounts = async () => {
    const response = await fetch("/api/players", {
      cache: "no-store",
    })
    const result = await response.json()

    if (!response.ok) {
      return
    }

    const counts = (result.players || []).reduce((acc: Record<string, number>, player: Player) => {
      acc[player.teamId] = (acc[player.teamId] || 0) + 1
      return acc
    }, {})

    setPlayerCounts(counts)
  }

  const handleSave = async (team: Team) => {
    const isEditing = Boolean(team.id)
    setIsSaving(true)
    openProgress(
      isEditing ? "Actualizando equipo" : "Creando equipo",
      isEditing ? "Guardando cambios del equipo en la base de datos." : "Registrando el nuevo equipo en la base de datos.",
    )

    const response = await fetch(isEditing ? `/api/teams/${team.id}` : "/api/teams", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(team),
    })
    const result = await response.json()

    closeProgress()
    setIsSaving(false)

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible guardar el equipo",
        description: result.error || "La operacion no pudo completarse.",
      })
      return
    }

    await loadTeams(selectedTournament || undefined)
    await loadPlayerCounts()

    setIsDialogOpen(false)
    setSelectedTeam(null)

    toast({
      title: isEditing ? "Equipo actualizado" : "Equipo creado",
      description: `${result.team.name} fue ${isEditing ? "actualizado" : "registrado"} correctamente.`,
    })
  }

  const handleDelete = async () => {
    if (!teamToDelete) return

    openProgress("Eliminando equipo", "Estamos eliminando el equipo y su informacion relacionada.")

    const response = await fetch(`/api/teams/${teamToDelete.id}`, {
      method: "DELETE",
    })
    const result = await response.json()
    closeProgress()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible eliminar el equipo",
        description: result.error || "La eliminacion no pudo completarse.",
      })
      return
    }

    const deletedTeamName = teamToDelete.name
    setTeamToDelete(null)

    await loadTeams(selectedTournament || undefined)
    await loadPlayerCounts()

    toast({
      title: "Equipo eliminado",
      description: `${deletedTeamName} fue eliminado correctamente.`,
    })
  }

  const handleCreate = () => {
    setSelectedTeam(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (team: Team) => {
    setSelectedTeam(team)
    setIsDialogOpen(true)
  }

  const getPlayerCount = (teamId: string) => {
    return playerCounts[teamId] || 0
  }

  const canManage = user?.role === "admin" || user?.role === "coach"

  if (viewingTeamId) {
    const team = teams.find((item) => item.id === viewingTeamId)
    if (team) {
      return <PlayerList team={team} onBack={() => setViewingTeamId(null)} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold">Equipos y Jugadores</h2>
          <p className="text-muted-foreground">Gestiona los equipos y sus plantillas</p>
        </div>
        {canManage && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Equipo
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un torneo" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name} - Futbol {tournament.format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedTournament && tournaments.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Selecciona un torneo para ver los equipos</p>
          </CardContent>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">No hay equipos registrados</p>
            <p className="mb-4 text-sm text-muted-foreground">Comienza agregando tu primer equipo</p>
            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Equipo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-24 w-24 border">
                      <AvatarImage src={team.logo || "/placeholder.svg"} alt={team.name} />
                      <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{team.name}</CardTitle>
                      <CardDescription className="mt-2 flex items-center">
                        <User className="mr-1 h-4 w-4" />
                        {getPlayerCount(team.id)} jugadores
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setViewingTeamId(team.id)} className="flex-1">
                    <UsersIcon className="mr-2 h-4 w-4" />
                    Ver Plantilla
                  </Button>
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(team)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setTeamToDelete(team)}>
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
        tournaments={tournaments}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <Dialog open={Boolean(teamToDelete)} onOpenChange={(open) => !open && setTeamToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar equipo</DialogTitle>
            <DialogDescription>
              {teamToDelete
                ? `Se eliminara ${teamToDelete.name} y sus jugadores asociados. Esta accion no se puede deshacer.`
                : "Confirma la eliminacion del equipo."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => void handleDelete()} className="flex-1">
              Eliminar
            </Button>
            <Button variant="outline" onClick={() => setTeamToDelete(null)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProgressDialog open={progressState.open} title={progressState.title} description={progressState.description} />
    </div>
  )
}
