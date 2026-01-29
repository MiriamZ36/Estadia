"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useLoading } from "@/lib/loading-context"
import { getPlayers, savePlayer, deletePlayer } from "@/lib/storage"
import type { Team, Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Pencil, Trash2, UserPlus } from "lucide-react"
import { PlayerDialog } from "./player-dialog"
import { AssignPlayerDialog } from "./assign-player-dialog"
import TeamBuilder from "@/components/team-builder"

interface PlayerListProps {
  team: Team
  onBack: () => void
}

export function PlayerList({ team, onBack }: PlayerListProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { startLoading, stopLoading } = useLoading()
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

  useEffect(() => {
    loadPlayers()
  }, [team.id])

  const loadPlayers = () => {
    const data = getPlayers(team.id)
    setPlayers(data)
  }

  const handleSave = (player: Player) => {
    try {
      startLoading(player.id ? "Actualizando jugador..." : "Agregando jugador...")
      savePlayer(player)
      loadPlayers()
      setIsDialogOpen(false)
      setSelectedPlayer(null)
      toast({
        title: player.id ? "Jugador actualizado" : "Jugador agregado",
        description: `${player.name} ha sido ${player.id ? "actualizado" : "agregado"} exitosamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el jugador.",
        variant: "destructive",
      })
    } finally {
      stopLoading()
    }
  }

  const handleAssignPlayer = (playerId: string) => {
    try {
      startLoading("Asignando jugador...")
      const allPlayers = getPlayers()
      const player = allPlayers.find((p) => p.id === playerId)
      if (player) {
        const updatedPlayer = { ...player, teamId: team.id }
        savePlayer(updatedPlayer)
        loadPlayers()
        toast({
          title: "Jugador asignado",
          description: `${player.name} ha sido asignado al equipo exitosamente.`,
        })
      }
      setIsAssignDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al asignar el jugador.",
        variant: "destructive",
      })
    } finally {
      stopLoading()
    }
  }

  const handleEdit = (player: Player) => {
    setSelectedPlayer(player)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const player = players.find((p) => p.id === id)
    if (confirm("¿Estás seguro de eliminar este jugador?")) {
      try {
        startLoading("Eliminando jugador...")
        deletePlayer(id)
        loadPlayers()
        toast({
          title: "Jugador eliminado",
          description: `${player?.name || "El jugador"} ha sido eliminado exitosamente.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Ocurrió un error al eliminar el jugador.",
          variant: "destructive",
        })
      } finally {
        stopLoading()
      }
    }
  }

  const handleCreate = () => {
    setSelectedPlayer(null)
    setIsDialogOpen(true)
  }

  const handlePlayerUpdate = (updatedPlayer: Player) => {
    savePlayer(updatedPlayer)
    loadPlayers()
  }

  const canManage = user?.role === "admin" || user?.role === "coach"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">{team.name}</h2>
          <p className="text-muted-foreground">Gestiona la plantilla y alineación del equipo</p>
        </div>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Lista de Jugadores</TabsTrigger>
          <TabsTrigger value="alineacion">Alineación</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {canManage && (
            <div className="flex gap-2">
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Jugador
              </Button>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar Jugador Existente
              </Button>
            </div>
          )}

          {players.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-medium mb-2">No hay jugadores registrados</p>
                <p className="text-sm text-muted-foreground mb-4">Comienza agregando jugadores al equipo</p>
                {canManage && (
                  <div className="flex gap-2">
                    <Button onClick={handleCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Nuevo Jugador
                    </Button>
                    <Button variant="outline" onClick={() => setIsAssignDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Agregar Existente
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {players.map((player) => (
                <Card key={player.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-white font-bold text-2xl">
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
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(player.id)}>
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
                <p className="text-lg font-medium mb-2">No hay jugadores para mostrar la alineación</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Agrega jugadores para ver la alineación en el campo
                </p>
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
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />

      <AssignPlayerDialog
        teamId={team.id}
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        onAssign={handleAssignPlayer}
      />
    </div>
  )
}
