"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SoccerField from "@/components/soccer-field"
import PlayerCard from "@/components/player-card"
import { Users, Shield, Target } from "lucide-react"
import type { Player } from "@/lib/types"

export type Formation = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1" | "5-3-2"

interface TeamBuilderProps {
  teamName?: string
  players?: Player[]
  onPlayerUpdate?: (player: Player) => void
}

export default function TeamBuilder({
  teamName: initialTeamName,
  players: initialPlayers,
  onPlayerUpdate,
}: TeamBuilderProps) {
  const [teamName, setTeamName] = useState(initialTeamName || "Mi Equipo")
  const [formation, setFormation] = useState<Formation>("4-3-3")
  const [players, setPlayers] = useState<Player[]>(
    initialPlayers && initialPlayers.length > 0
      ? initialPlayers
      : [
          { id: "1", name: "Portero", number: 1, position: "Portero", teamId: "" },
          { id: "2", name: "Defensa 1", number: 2, position: "Defensa", teamId: "" },
          { id: "3", name: "Defensa 2", number: 3, position: "Defensa", teamId: "" },
          { id: "4", name: "Defensa 3", number: 4, position: "Defensa", teamId: "" },
          { id: "5", name: "Defensa 4", number: 5, position: "Defensa", teamId: "" },
          { id: "6", name: "Medio 1", number: 6, position: "Medio", teamId: "" },
          { id: "7", name: "Medio 2", number: 7, position: "Medio", teamId: "" },
          { id: "8", name: "Medio 3", number: 8, position: "Medio", teamId: "" },
          { id: "9", name: "Delantero 1", number: 9, position: "Delantero", teamId: "" },
          { id: "10", name: "Delantero 2", number: 10, position: "Delantero", teamId: "" },
          { id: "11", name: "Delantero 3", number: 11, position: "Delantero", teamId: "" },
        ],
  )
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player)
  }

  const handlePlayerUpdate = (updatedPlayer: Player) => {
    setPlayers(players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)))
    setSelectedPlayer(updatedPlayer)
    if (onPlayerUpdate) {
      onPlayerUpdate(updatedPlayer)
    }
  }

  const handlePhotoUpload = (playerId: string, photoUrl: string) => {
    const updatedPlayers = players.map((p) => (p.id === playerId ? { ...p, photo: photoUrl } : p))
    setPlayers(updatedPlayers)
    const updatedPlayer = updatedPlayers.find((p) => p.id === playerId)
    if (updatedPlayer && onPlayerUpdate) {
      onPlayerUpdate(updatedPlayer)
    }
  }

  const handlePlayerDrop = (draggedPlayerId: string, targetIndex: number) => {
    const draggedIndex = players.findIndex((p) => p.id === draggedPlayerId)
    if (draggedIndex === -1 || draggedIndex === targetIndex) return

    const newPlayers = [...players]
    const draggedPlayer = newPlayers[draggedIndex]
    const targetPlayer = newPlayers[targetIndex]

    // Swap positions
    newPlayers[draggedIndex] = targetPlayer
    newPlayers[targetIndex] = draggedPlayer

    setPlayers(newPlayers)

    // Update both players if callback exists
    if (onPlayerUpdate) {
      onPlayerUpdate(draggedPlayer)
      onPlayerUpdate(targetPlayer)
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="border-2 border-green-600/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  {teamName}
                </CardTitle>
                <CardDescription className="text-green-50">Formación: {formation}</CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                <Users className="h-5 w-5" />
                <span className="font-bold">{players.length}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <SoccerField
              formation={formation}
              players={players}
              onPlayerSelect={handlePlayerSelect}
              selectedPlayerId={selectedPlayer?.id}
              onPlayerDrop={handlePlayerDrop}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Nombre del Equipo</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Ingresa el nombre"
                disabled={!!initialTeamName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formation">Formación</Label>
              <Select value={formation} onValueChange={(value) => setFormation(value as Formation)}>
                <SelectTrigger id="formation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4-3-3">4-3-3</SelectItem>
                  <SelectItem value="4-4-2">4-4-2</SelectItem>
                  <SelectItem value="3-5-2">3-5-2</SelectItem>
                  <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                  <SelectItem value="5-3-2">5-3-2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedPlayer && (
          <PlayerCard player={selectedPlayer} onUpdate={handlePlayerUpdate} onPhotoUpload={handlePhotoUpload} />
        )}

        {!selectedPlayer && (
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-lg">Instrucciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>✨ Haz clic en un jugador para editar su información</p>
              <p>🔄 Arrastra y suelta jugadores para intercambiar posiciones</p>
              <p>⚽ Cambia la formación para reorganizar el equipo</p>
              <p>📸 Actualiza fotos usando carga de archivos</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
