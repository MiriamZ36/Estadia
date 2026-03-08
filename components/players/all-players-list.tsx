"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Player, Team } from "@/lib/types"
import { PlayerDialog } from "@/components/teams/player-dialog"
import { ProgressDialog } from "@/components/ui/progress-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export function AllPlayersList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState("all")
  const [progressState, setProgressState] = useState<ProgressState>(idleProgress)

  useEffect(() => {
    void loadData()
  }, [])

  const loadData = async () => {
    const [playersResponse, teamsResponse] = await Promise.all([
      fetch("/api/players", { cache: "no-store" }),
      fetch("/api/teams", { cache: "no-store" }),
    ])

    const playersResult = await playersResponse.json()
    const teamsResult = await teamsResponse.json()

    if (!playersResponse.ok || !teamsResponse.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible cargar los jugadores",
        description: playersResult.error || teamsResult.error || "Verifica tu conexion y la sesion actual.",
      })
      return
    }

    setPlayers(playersResult.players || [])
    setTeams(teamsResult.teams || [])
  }

  const getTeamName = (teamId: string) => {
    const team = teams.find((item) => item.id === teamId)
    return team?.name || "Sin equipo"
  }

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

  const handleSave = async (player: Player) => {
    const isEditing = Boolean(player.id)

    setIsSaving(true)
    openProgress(
      isEditing ? "Actualizando jugador" : "Creando jugador",
      isEditing ? "Guardando los cambios del jugador en la base de datos." : "Registrando al nuevo jugador en la base de datos.",
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

    await loadData()
    setIsDialogOpen(false)
    setSelectedPlayer(null)

    toast({
      title: isEditing ? "Jugador actualizado" : "Jugador creado",
      description: `${result.player.name} fue ${isEditing ? "actualizado" : "registrado"} correctamente.`,
    })
  }

  const handleDelete = async () => {
    if (!playerToDelete) return

    openProgress("Eliminando jugador", "Estamos removiendo al jugador y sus relaciones derivadas.")

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
    await loadData()

    toast({
      title: "Jugador eliminado",
      description: `${deletedPlayerName} fue eliminado correctamente.`,
    })
  }

  const handleEdit = (player: Player) => {
    setSelectedPlayer(player)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedPlayer(null)
    setIsDialogOpen(true)
  }

  const canManage = user?.role === "admin" || user?.role === "coach"
  const availablePositions = Array.from(new Set(players.map((player) => player.position).filter(Boolean))).sort()
  const filteredPlayers = players.filter((player) => {
    const matchesTeam = selectedTeamFilter === "all" || player.teamId === selectedTeamFilter
    const matchesPosition = positionFilter === "all" || player.position === positionFilter
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      player.name.toLowerCase().includes(normalizedSearch) ||
      player.position.toLowerCase().includes(normalizedSearch) ||
      getTeamName(player.teamId).toLowerCase().includes(normalizedSearch) ||
      String(player.number).includes(normalizedSearch)

    return matchesTeam && matchesPosition && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-3xl font-bold">
            <Users className="h-8 w-8" />
            Jugadores
          </h2>
          <p className="text-muted-foreground">Gestion de todos los jugadores registrados</p>
        </div>
        {canManage && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Jugador
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTeamFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedTeamFilter("all")}
        >
          Todos ({players.length})
        </Button>
        {teams.map((team) => {
          const count = players.filter((player) => player.teamId === team.id).length

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

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar por nombre, numero, posicion o equipo"
        />
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por posicion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las posiciones</SelectItem>
            {availablePositions.map((position) => (
              <SelectItem key={position} value={position}>
                {position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredPlayers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-16 w-16 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">No se encontraron jugadores</p>
            <p className="mb-4 text-sm text-muted-foreground">Ajusta la busqueda o los filtros para ver resultados</p>
            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Jugador
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <Card key={player.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {player.photo ? (
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={player.photo || "/placeholder.svg"} alt={player.name} />
                      <AvatarFallback className="bg-gradient-to-br from-green-600 to-emerald-700 text-xl font-bold text-white">
                        {player.number}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-700 text-2xl font-bold text-white">
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

      <PlayerDialog
        player={selectedPlayer}
        teamId={undefined}
        teams={teams}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <Dialog open={Boolean(playerToDelete)} onOpenChange={(open) => !open && setPlayerToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar jugador</DialogTitle>
            <DialogDescription>
              {playerToDelete
                ? `Se eliminara a ${playerToDelete.name}. Esta accion no se puede deshacer.`
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
