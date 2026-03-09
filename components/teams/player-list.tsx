"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Pencil, Plus, Trash2, UserPlus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Player, Team } from "@/lib/types"
import TeamBuilder from "@/components/team-builder"
import { AssignPlayerDialog } from "./assign-player-dialog"
import { PlayerDialog } from "./player-dialog"
import { ProgressDialog } from "@/components/ui/progress-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PlayerListProps {
  team: Team
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

export function PlayerList({ team, onBack }: PlayerListProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progressState, setProgressState] = useState<ProgressState>(idleProgress)

  useEffect(() => {
    const loadInitialData = async () => {
      openProgress("Cargando plantilla", "Consultando jugadores del equipo y catalogo de equipos.")
      await Promise.all([loadPlayers(), loadTeams()])
      closeProgress()
    }

    void loadInitialData()
  }, [team.id])

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

  const loadPlayers = async () => {
    const response = await fetch(`/api/players?teamId=${team.id}`, {
      cache: "no-store",
    })
    const result = await response.json()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible cargar la plantilla",
        description: result.error || "La lista de jugadores no pudo recuperarse.",
      })
      return
    }

    setPlayers(result.players || [])
  }

  const loadTeams = async () => {
    const response = await fetch("/api/teams", {
      cache: "no-store",
    })
    const result = await response.json()

    if (!response.ok) {
      return
    }

    setTeams(result.teams || [])
  }

  const handleSave = async (player: Player) => {
    const isEditing = Boolean(player.id)
    setIsSaving(true)
    openProgress(
      isEditing ? "Actualizando jugador" : "Agregando jugador",
      isEditing ? "Guardando cambios de la plantilla en la base de datos." : "Registrando un nuevo jugador en la plantilla.",
    )

    const response = await fetch(isEditing ? `/api/players/${player.id}` : "/api/players", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(player),
    })

    const result = await response.json()
    closeProgress()
    setIsSaving(false)

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible guardar el jugador",
        description: result.error || "La operacion no pudo completarse.",
      })
      return
    }

    await loadPlayers()
    setIsDialogOpen(false)
    setSelectedPlayer(null)

    toast({
      title: isEditing ? "Jugador actualizado" : "Jugador agregado",
      description: `${result.player.name} fue ${isEditing ? "actualizado" : "registrado"} correctamente.`,
    })
  }

  const handleAssignPlayer = async (playerId: string) => {
    openProgress("Reasignando jugador", "Estamos moviendo al jugador hacia esta plantilla.")

    const currentPlayerResponse = await fetch("/api/players", {
      cache: "no-store",
    })
    const currentPlayerResult = await currentPlayerResponse.json()

    if (!currentPlayerResponse.ok) {
      closeProgress()
      toast({
        variant: "destructive",
        title: "No fue posible cargar el jugador",
        description: currentPlayerResult.error || "La reasignacion no pudo completarse.",
      })
      return
    }

    const selected = (currentPlayerResult.players || []).find((item: Player) => item.id === playerId)

    if (!selected) {
      closeProgress()
      toast({
        variant: "destructive",
        title: "Jugador no encontrado",
        description: "No se encontro el jugador seleccionado para reasignar.",
      })
      return
    }

    const response = await fetch(`/api/players/${playerId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...selected, teamId: team.id }),
    })

    const result = await response.json()
    closeProgress()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible reasignar el jugador",
        description: result.error || "La reasignacion no pudo completarse.",
      })
      return
    }

    setIsAssignDialogOpen(false)
    await loadPlayers()

    toast({
      title: "Jugador reasignado",
      description: `${result.player.name} ahora pertenece a ${team.name}.`,
    })
  }

  const handleDelete = async () => {
    if (!playerToDelete) return

    openProgress("Eliminando jugador", "Estamos removiendo al jugador de la plantilla.")

    const response = await fetch(`/api/players/${playerToDelete.id}`, {
      method: "DELETE",
    })
    const result = await response.json()
    closeProgress()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible eliminar el jugador",
        description: result.error || "La eliminacion no pudo completarse.",
      })
      return
    }

    const deletedPlayerName = playerToDelete.name
    setPlayerToDelete(null)
    await loadPlayers()

    toast({
      title: "Jugador eliminado",
      description: `${deletedPlayerName} fue eliminado correctamente.`,
    })
  }

  const handleCreate = () => {
    setSelectedPlayer(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (player: Player) => {
    setSelectedPlayer(player)
    setIsDialogOpen(true)
  }

  const handlePlayerUpdate = (_updatedPlayer: Player) => {
    void loadPlayers()
  }

  const canManage = user?.role === "admin" || user?.role === "coach"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">{team.name}</h2>
          <p className="text-muted-foreground">Gestiona la plantilla y alineacion del equipo</p>
        </div>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Lista de Jugadores</TabsTrigger>
          <TabsTrigger value="alineacion">Alineacion</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {canManage && (
            <div className="flex gap-2">
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Jugador
              </Button>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Reasignar Jugador
              </Button>
            </div>
          )}

          {players.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="mb-2 text-lg font-medium">No hay jugadores registrados</p>
                <p className="mb-4 text-sm text-muted-foreground">Comienza agregando jugadores al equipo</p>
                {canManage && (
                  <div className="flex gap-2">
                    <Button onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Nuevo Jugador
                    </Button>
                    <Button variant="outline" onClick={() => setIsAssignDialogOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Reasignar Existente
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {players.map((player) => (
                <Card key={player.id} className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-700 text-2xl font-bold text-white">
                        {player.number}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{player.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{player.position}</p>
                      </div>
                    </div>
                  </CardHeader>
                  {canManage && (
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(player)} className="flex-1">
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setPlayerToDelete(player)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alineacion" className="space-y-4">
          {players.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="mb-2 text-lg font-medium">No hay jugadores para mostrar la alineacion</p>
                <p className="text-sm text-muted-foreground">Agrega jugadores para ver la alineacion en el campo</p>
              </CardContent>
            </Card>
          ) : (
            <TeamBuilder teamName={team.name} players={players} onPlayerUpdate={handlePlayerUpdate} />
          )}
        </TabsContent>
      </Tabs>

      <PlayerDialog
        player={selectedPlayer}
        teamId={team.id}
        teams={teams}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <AssignPlayerDialog
        teamId={team.id}
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        onAssign={handleAssignPlayer}
      />

      <Dialog open={Boolean(playerToDelete)} onOpenChange={(open) => !open && setPlayerToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar jugador</DialogTitle>
            <DialogDescription>
              {playerToDelete
                ? `Se eliminara a ${playerToDelete.name} del sistema. Esta accion no se puede deshacer.`
                : "Confirma la eliminacion del jugador."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => void handleDelete()} className="flex-1">
              Eliminar
            </Button>
            <Button variant="outline" onClick={() => setPlayerToDelete(null)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProgressDialog open={progressState.open} title={progressState.title} description={progressState.description} />
    </div>
  )
}
