"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getMatchEvents, saveMatchEvent, getPlayers } from "@/lib/storage"
import type { Match, Team, MatchEvent, Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, Square, AlertCircle } from "lucide-react"

interface MatchDetailProps {
  match: Match
  teams: Team[]
  onBack: () => void
  onUpdate: (match: Match) => void
}

export function MatchDetail({ match, teams, onBack, onUpdate }: MatchDetailProps) {
  const { user } = useAuth()
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [homeScore, setHomeScore] = useState(match.homeScore || 0)
  const [awayScore, setAwayScore] = useState(match.awayScore || 0)
  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])
  const [eventType, setEventType] = useState<MatchEvent["type"]>("goal")
  const [selectedTeam, setSelectedTeam] = useState<string>(match.homeTeamId)
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [minute, setMinute] = useState<number>(1)

  const homeTeam = teams.find((t) => t.id === match.homeTeamId)
  const awayTeam = teams.find((t) => t.id === match.awayTeamId)

  useEffect(() => {
    loadEvents()
    setHomePlayers(getPlayers(match.homeTeamId))
    setAwayPlayers(getPlayers(match.awayTeamId))
  }, [match.id])

  const loadEvents = () => {
    const data = getMatchEvents(match.id)
    setEvents(data)
  }

  const handleStartMatch = () => {
    const updatedMatch = { ...match, status: "live" as const }
    onUpdate(updatedMatch)
  }

  const handleEndMatch = () => {
    const updatedMatch = { ...match, status: "finished" as const, homeScore, awayScore }
    onUpdate(updatedMatch)
  }

  const handleAddEvent = () => {
    if (!selectedPlayer) {
      alert("Selecciona un jugador")
      return
    }

    const event: MatchEvent = {
      id: Date.now().toString(),
      matchId: match.id,
      type: eventType,
      playerId: selectedPlayer,
      teamId: selectedTeam,
      minute,
    }

    saveMatchEvent(event)
    loadEvents()

    if (eventType === "goal") {
      if (selectedTeam === match.homeTeamId) {
        setHomeScore(homeScore + 1)
      } else {
        setAwayScore(awayScore + 1)
      }
    }

    setSelectedPlayer("")
  }

  const getEventIcon = (type: MatchEvent["type"]) => {
    switch (type) {
      case "goal":
        return "⚽"
      case "yellow_card":
        return "🟨"
      case "red_card":
        return "🟥"
      case "substitution":
        return "🔄"
      default:
        return "•"
    }
  }

  const getPlayerName = (playerId: string) => {
    const player = [...homePlayers, ...awayPlayers].find((p) => p.id === playerId)
    return player?.name || "Jugador"
  }

  const canManage = user?.role === "admin" || user?.role === "referee"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">Detalle del Partido</h2>
        </div>
      </div>

      <Card className="border-2 border-green-600/20">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <CardTitle className="text-2xl">{homeTeam?.name}</CardTitle>
            </div>
            <div className="px-8">
              <div className="text-5xl font-bold">
                {homeScore} - {awayScore}
              </div>
            </div>
            <div className="text-center flex-1">
              <CardTitle className="text-2xl">{awayTeam?.name}</CardTitle>
            </div>
          </div>
          <div className="text-center text-green-50 mt-4">
            <p>
              {new Date(match.date).toLocaleDateString("es-MX")} - {match.time}
            </p>
            <p>{match.venue}</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center gap-4">
            {match.status === "scheduled" && canManage && (
              <Button onClick={handleStartMatch} size="lg">
                <Play className="h-4 w-4 mr-2" />
                Iniciar Partido
              </Button>
            )}
            {match.status === "live" && canManage && (
              <Button onClick={handleEndMatch} variant="destructive" size="lg">
                <Square className="h-4 w-4 mr-2" />
                Finalizar Partido
              </Button>
            )}
            {match.status === "finished" && <Badge className="text-lg py-2 px-4">Partido Finalizado</Badge>}
          </div>
        </CardContent>
      </Card>

      {canManage && match.status === "live" && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label>Tipo de Evento</Label>
                <Select value={eventType} onValueChange={(value) => setEventType(value as MatchEvent["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goal">Gol</SelectItem>
                    <SelectItem value="yellow_card">Tarjeta Amarilla</SelectItem>
                    <SelectItem value="red_card">Tarjeta Roja</SelectItem>
                    <SelectItem value="substitution">Sustitución</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Equipo</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={match.homeTeamId}>{homeTeam?.name}</SelectItem>
                    <SelectItem value={match.awayTeamId}>{awayTeam?.name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Jugador</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedTeam === match.homeTeamId ? homePlayers : awayPlayers).map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        #{player.number} {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Minuto</Label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={minute}
                  onChange={(e) => setMinute(Number.parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={handleAddEvent} className="w-full">
                  Registrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Eventos del Partido</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2" />
              <p>No hay eventos registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events
                .sort((a, b) => a.minute - b.minute)
                .map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                    <div className="text-2xl">{getEventIcon(event.type)}</div>
                    <div className="flex-1">
                      <p className="font-medium">{getPlayerName(event.playerId)}</p>
                      <p className="text-sm text-muted-foreground">{teams.find((t) => t.id === event.teamId)?.name}</p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {event.minute}'
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
