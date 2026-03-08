"use client"

import { useEffect, useState } from "react"
import { Calendar, Pencil, Plus, Trash2, Trophy } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Team, Tournament } from "@/lib/types"
import { TournamentDialog } from "./tournament-dialog"
import { TournamentDetail } from "./tournament-detail"
import { ProgressDialog } from "@/components/ui/progress-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

export function TournamentList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [viewingTournament, setViewingTournament] = useState<Tournament | null>(null)
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progressState, setProgressState] = useState<ProgressState>(idleProgress)

  useEffect(() => {
    void loadData()
  }, [])

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
    const [tournamentsResponse, teamsResponse] = await Promise.all([
      fetch("/api/tournaments", { cache: "no-store" }),
      fetch("/api/teams", { cache: "no-store" }),
    ])
    const tournamentsResult = await tournamentsResponse.json()
    const teamsResult = await teamsResponse.json()

    if (!tournamentsResponse.ok || !teamsResponse.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible cargar torneos",
        description: tournamentsResult.error || teamsResult.error || "Verifica la conexion con la base de datos.",
      })
      return
    }

    setTournaments(tournamentsResult.tournaments || [])
    setTeams(teamsResult.teams || [])
  }

  const handleSave = async (tournament: Tournament) => {
    const isEditing = Boolean(tournament.id)
    setIsSaving(true)
    openProgress(
      isEditing ? "Actualizando torneo" : "Creando torneo",
      isEditing ? "Guardando cambios del torneo en la base de datos." : "Registrando el nuevo torneo en la base de datos.",
    )

    const response = await fetch(isEditing ? `/api/tournaments/${tournament.id}` : "/api/tournaments", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tournament),
    })
    const result = await response.json()
    closeProgress()
    setIsSaving(false)

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible guardar el torneo",
        description: result.error || "La operacion no pudo completarse.",
      })
      return
    }

    await loadData()
    setIsDialogOpen(false)
    setSelectedTournament(null)

    toast({
      title: isEditing ? "Torneo actualizado" : "Torneo creado",
      description: `${result.tournament.name} fue ${isEditing ? "actualizado" : "registrado"} correctamente.`,
    })
  }

  const handleDelete = async () => {
    if (!tournamentToDelete) return

    openProgress("Eliminando torneo", "Estamos eliminando el torneo y su informacion relacionada.")

    const response = await fetch(`/api/tournaments/${tournamentToDelete.id}`, {
      method: "DELETE",
    })
    const result = await response.json()
    closeProgress()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible eliminar el torneo",
        description: result.error || "La eliminacion no pudo completarse.",
      })
      return
    }

    const deletedTournamentName = tournamentToDelete.name
    setTournamentToDelete(null)
    await loadData()

    toast({
      title: "Torneo eliminado",
      description: `${deletedTournamentName} fue eliminado correctamente.`,
    })
  }

  const handleEdit = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedTournament(null)
    setIsDialogOpen(true)
  }

  const handleView = (tournament: Tournament) => {
    setViewingTournament(tournament)
  }

  const handleBackToList = async () => {
    setViewingTournament(null)
    await loadData()
  }

  const getStatusBadge = (status: Tournament["status"]) => {
    const variants = {
      upcoming: "secondary",
      active: "default",
      completed: "outline",
    } as const

    const labels = {
      upcoming: "Proximo",
      active: "En curso",
      completed: "Finalizado",
    }

    return <Badge variant={variants[status] || "secondary"}>{labels[status]}</Badge>
  }

  const getTeamCount = (tournamentId: string) => {
    return teams.filter((team) => team.tournamentId === tournamentId).length
  }

  const canManage = user?.role === "admin"

  if (viewingTournament) {
    return <TournamentDetail tournament={viewingTournament} onBack={() => void handleBackToList()} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Torneos</h2>
          <p className="text-muted-foreground">Gestiona y visualiza los torneos de futbol</p>
        </div>
        {canManage && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Torneo
          </Button>
        )}
      </div>

      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">No hay torneos registrados</p>
            <p className="mb-4 text-sm text-muted-foreground">Comienza creando tu primer torneo</p>
            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Torneo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{tournament.name}</CardTitle>
                    <CardDescription className="mt-2">Formato: Futbol {tournament.format}</CardDescription>
                  </div>
                  {getStatusBadge(tournament.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>
                      {new Date(tournament.startDate).toLocaleDateString("es-MX")} -{" "}
                      {new Date(tournament.endDate).toLocaleDateString("es-MX")}
                    </span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Trophy className="mr-2 h-4 w-4" />
                    <span>{getTeamCount(tournament.id)} equipos participantes</span>
                  </div>
                  {tournament.rules && <p className="line-clamp-2 text-muted-foreground">{tournament.rules}</p>}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(tournament)} className="flex-1">
                    <Trophy className="mr-2 h-4 w-4" />
                    Ver Detalles
                  </Button>
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(tournament)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setTournamentToDelete(tournament)}>
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

      <TournamentDialog
        tournament={selectedTournament}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        userId={user?.id || ""}
        isSaving={isSaving}
      />

      <Dialog open={Boolean(tournamentToDelete)} onOpenChange={(open) => !open && setTournamentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar torneo</DialogTitle>
            <DialogDescription>
              {tournamentToDelete
                ? `Se eliminara ${tournamentToDelete.name} y todos sus datos asociados. Esta accion no se puede deshacer.`
                : "Confirma la eliminacion del torneo."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => void handleDelete()} className="flex-1">
              Eliminar
            </Button>
            <Button variant="outline" onClick={() => setTournamentToDelete(null)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProgressDialog open={progressState.open} title={progressState.title} description={progressState.description} />
    </div>
  )
}
