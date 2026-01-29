"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useLoading } from "@/lib/loading-context"
import { getPlayers, getTeams, savePlayer, deletePlayer } from "@/lib/storage"
import type { Team, Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { PlayerDialog } from "@/components/teams/player-dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function AllPlayersList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { startLoading, stopLoading } = useLoading()
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const allPlayers = getPlayers()
    const allTeams = getTeams()
    setPlayers(allPlayers)
    setTeams(allTeams)
  }

  const getTeamName = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    return team?.name || "Sin equipo"
  }

  const handleSave = (player: Player) => {
    try {
      startLoading(player.id ? "Actualizando jugador..." : "Creando jugador...")
      savePlayer(player)
      loadData()
      setIsDialogOpen(false)
      setSelectedPlayer(null)
      toast({
        title: player.id ? "Jugador actualizado" : "Jugador creado",
        description: `${player.name} ha sido ${player.id ? "actualizado" : "creado"} exitosamente.`,
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
        loadData()
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

  const canManage = user?.role === "admin" || user?.role === "coach"

  const filteredPlayers =
    selectedTeamFilter === "all" ? players : players.filter((p) => p.teamId === selectedTeamFilter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Jugadores
          </h2>
          <p className="text-muted-foreground">Gestión de todos los jugadores registrados</p>
        </div>
        {canManage && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Jugador
          </Button>
        )}
      </div>

      {/* Filter by team */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedTeamFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTeamFilter("all")}
        >
          Todos ({players.length})
        </Button>
        {teams.map((team) => {
          const count = players.filter((p) => p.teamId === team.id).length
          return (
            <Button
              key={team.id}
              variant={selectedTeamFilter === team.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTeamFilter(team.id)}
            >
              {team.name} ({count})
            </Button>
          )
        })}
      </div>

      {filteredPlayers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay jugadores registrados</p>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedTeamFilter === "all"
                ? "Comienza agregando jugadores al sistema"
                : "Este equipo no tiene jugadores"}
            </p>
            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Jugador
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {player.photo ? (
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={player.photo || "/placeholder.svg"} alt={player.name} />
                      <AvatarFallback className="bg-gradient-to-br from-green-600 to-emerald-700 text-white font-bold text-xl">
                        {player.number}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-white font-bold text-2xl">
                      {player.number}
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{player.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{player.position}</p>
                    <Badge variant="outline" className="mt-1">
                      {getTeamName(player.teamId)}
                    </Badge>
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

      <PlayerDialog
        player={selectedPlayer}
        teamId={selectedPlayer?.teamId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />
    </div>
  )
}
