"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Pause, Play, Square, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Match, MatchEvent, Player, Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface MatchDetailProps {
  match: Match
  teams: Team[]
  onBack: () => void
  onMatchUpdated: (match: Match) => Promise<void>
}

function formatStopwatch(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

type MatchClockState = {
  elapsedSeconds: number
  isPaused: boolean
  updatedAt: number
}

const MATCH_CLOCK_STORAGE_PREFIX = "match-stopwatch:"

export function MatchDetail({ match, teams, onBack, onMatchUpdated }: MatchDetailProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentMatch, setCurrentMatch] = useState<Match>(match)
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])
  const [eventType, setEventType] = useState<MatchEvent["type"]>("goal")
  const [selectedTeam, setSelectedTeam] = useState<string>(match.homeTeamId)
  const [selectedPlayer, setSelectedPlayer] = useState<string>("")
  const [minute, setMinute] = useState<number>(1)
  const [description, setDescription] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false)
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false)

  const homeTeam = teams.find((t) => t.id === currentMatch.homeTeamId)
  const awayTeam = teams.find((t) => t.id === currentMatch.awayTeamId)
  const canManage = user?.role === "admin" || user?.role === "referee"
  const matchClockKey = `${MATCH_CLOCK_STORAGE_PREFIX}${currentMatch.id}`

  const selectablePlayers = useMemo(
    () => (selectedTeam === currentMatch.homeTeamId ? homePlayers : awayPlayers),
    [selectedTeam, currentMatch.homeTeamId, homePlayers, awayPlayers],
  )

  useEffect(() => {
    setCurrentMatch(match)
    setSelectedTeam(match.homeTeamId)
  }, [match])

  useEffect(() => {
    if (typeof window === "undefined") return

    if (currentMatch.status === "finished") {
      setElapsedSeconds(0)
      setIsPaused(true)
      window.localStorage.removeItem(matchClockKey)
      return
    }

    const persisted = window.localStorage.getItem(matchClockKey)
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted) as MatchClockState
        const safeElapsed = Number.isFinite(parsed.elapsedSeconds) ? Math.max(0, Math.floor(parsed.elapsedSeconds)) : 0
        const safeIsPaused = Boolean(parsed.isPaused)
        const safeUpdatedAt = Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : Date.now()
        const elapsedWhileAway = safeIsPaused ? 0 : Math.max(0, Math.floor((Date.now() - safeUpdatedAt) / 1000))

        setElapsedSeconds(safeElapsed + elapsedWhileAway)
        setIsPaused(safeIsPaused)
      } catch {
        window.localStorage.removeItem(matchClockKey)
      }
      return
    }

    if (currentMatch.status === "live") {
      const fallbackSeconds = currentMatch.updatedAt
        ? Math.max(0, Math.floor((Date.now() - new Date(currentMatch.updatedAt).getTime()) / 1000))
        : 0

      const bootstrapState: MatchClockState = {
        elapsedSeconds: fallbackSeconds,
        isPaused: false,
        updatedAt: Date.now(),
      }
      window.localStorage.setItem(matchClockKey, JSON.stringify(bootstrapState))
      setElapsedSeconds(fallbackSeconds)
      setIsPaused(false)
    }
  }, [currentMatch.id, currentMatch.status, currentMatch.updatedAt, matchClockKey])

  useEffect(() => {
    const loadData = async () => {
      const [eventsResponse, homePlayersResponse, awayPlayersResponse] = await Promise.all([
        fetch(`/api/match-events?matchId=${currentMatch.id}`, { cache: "no-store" }),
        fetch(`/api/players?teamId=${currentMatch.homeTeamId}`, { cache: "no-store" }),
        fetch(`/api/players?teamId=${currentMatch.awayTeamId}`, { cache: "no-store" }),
      ])

      const eventsResult = await eventsResponse.json()
      const homePlayersResult = await homePlayersResponse.json()
      const awayPlayersResult = await awayPlayersResponse.json()

      if (!eventsResponse.ok || !homePlayersResponse.ok || !awayPlayersResponse.ok) {
        toast({
          variant: "destructive",
          title: "No fue posible cargar el detalle del partido",
          description: eventsResult.error || homePlayersResult.error || awayPlayersResult.error || "Intenta nuevamente.",
        })
        return
      }

      setEvents(eventsResult.events || [])
      setHomePlayers(homePlayersResult.players || [])
      setAwayPlayers(awayPlayersResult.players || [])
    }

    void loadData()
  }, [currentMatch.id, currentMatch.homeTeamId, currentMatch.awayTeamId, toast])

  useEffect(() => {
    if (currentMatch.status !== "live" || isPaused) return

    const timer = window.setInterval(() => {
      setElapsedSeconds((previous) => previous + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [currentMatch.status, isPaused])

  useEffect(() => {
    if (typeof window === "undefined") return

    if (currentMatch.status === "finished") {
      window.localStorage.removeItem(matchClockKey)
      return
    }

    if (currentMatch.status !== "live") return

    const payload: MatchClockState = {
      elapsedSeconds,
      isPaused,
      updatedAt: Date.now(),
    }
    window.localStorage.setItem(matchClockKey, JSON.stringify(payload))
  }, [currentMatch.status, elapsedSeconds, isPaused, matchClockKey])

  const persistMatch = async (partial: Partial<Match>) => {
    const payload: Match = {
      ...currentMatch,
      ...partial,
    }

    const response = await fetch(`/api/matches/${currentMatch.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    const result = await response.json()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible actualizar el partido",
        description: result.error || "La operacion no pudo completarse.",
      })
      return null
    }

    const updatedMatch = result.match as Match
    setCurrentMatch(updatedMatch)
    await onMatchUpdated(updatedMatch)
    return updatedMatch
  }

  const handleStartMatch = async () => {
    const updatedMatch = await persistMatch({
      status: "live",
      homeScore: currentMatch.homeScore || 0,
      awayScore: currentMatch.awayScore || 0,
    })

    if (!updatedMatch) return
    setElapsedSeconds(0)
    setIsPaused(false)

    toast({
      title: "Partido iniciado",
      description: "El cronometro se encuentra en ejecucion.",
    })
  }

  const handleTogglePause = () => {
    setIsPaused((previous) => !previous)
  }

  const handleEndMatch = async () => {
    const updatedMatch = await persistMatch({
      status: "finished",
      homeScore: currentMatch.homeScore || 0,
      awayScore: currentMatch.awayScore || 0,
    })

    if (!updatedMatch) return
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(matchClockKey)
    }
    setIsPaused(true)
    setIsFinishConfirmOpen(false)

    toast({
      title: "Partido finalizado",
      description: "El cronometro se detuvo y el resultado quedo registrado.",
    })
  }

  const handleAddEvent = async () => {
    if (!selectedPlayer) {
      toast({
        variant: "destructive",
        title: "Falta seleccionar jugador",
        description: "Debes seleccionar un jugador para registrar el evento.",
      })
      return
    }

    setIsSubmittingEvent(true)
    const response = await fetch("/api/match-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matchId: currentMatch.id,
        type: eventType,
        playerId: selectedPlayer,
        teamId: selectedTeam,
        minute,
        description: description || null,
      }),
    })
    const result = await response.json()
    setIsSubmittingEvent(false)

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible registrar el evento",
        description: result.error || "Intenta nuevamente.",
      })
      return
    }

    const createdEvent = result.event as MatchEvent
    setEvents((previous) => [...previous, createdEvent].sort((a, b) => a.minute - b.minute))

    if (eventType === "goal") {
      const nextHomeScore = selectedTeam === currentMatch.homeTeamId ? (currentMatch.homeScore || 0) + 1 : currentMatch.homeScore || 0
      const nextAwayScore = selectedTeam === currentMatch.awayTeamId ? (currentMatch.awayScore || 0) + 1 : currentMatch.awayScore || 0
      await persistMatch({
        homeScore: nextHomeScore,
        awayScore: nextAwayScore,
      })
    }

    setSelectedPlayer("")
    setDescription("")
    toast({
      title: "Evento registrado",
      description: "El evento del partido se registro correctamente.",
    })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">Detalle del Partido</h2>
        </div>
      </div>

      <Card className="border-2 border-green-600/20">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <CardTitle className="text-2xl">{homeTeam?.name}</CardTitle>
            </div>
            <div className="px-8">
              <div className="text-5xl font-bold">
                {currentMatch.homeScore || 0} - {currentMatch.awayScore || 0}
              </div>
            </div>
            <div className="flex-1 text-center">
              <CardTitle className="text-2xl">{awayTeam?.name}</CardTitle>
            </div>
          </div>
          <div className="mt-4 text-center text-green-50">
            <p>
              {new Date(currentMatch.date).toLocaleDateString("es-MX")} - {currentMatch.time}
            </p>
            <p>{currentMatch.venue}</p>
            <p className="mt-2 text-lg font-semibold">Cronometro: {formatStopwatch(elapsedSeconds)}</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap justify-center gap-3">
            {currentMatch.status === "scheduled" && canManage && (
              <Button onClick={() => void handleStartMatch()} size="lg">
                <Play className="mr-2 h-4 w-4" />
                Iniciar Partido
              </Button>
            )}
            {currentMatch.status === "live" && canManage && (
              <>
                <Button onClick={handleTogglePause} variant="outline" size="lg">
                  <Pause className="mr-2 h-4 w-4" />
                  {isPaused ? "Reanudar" : "Pausar"}
                </Button>
                <Button onClick={() => setIsFinishConfirmOpen(true)} variant="destructive" size="lg">
                  <Square className="mr-2 h-4 w-4" />
                  Finalizar Partido
                </Button>
              </>
            )}
            {currentMatch.status === "finished" && <Badge className="px-4 py-2 text-lg">Partido Finalizado</Badge>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFinishConfirmOpen} onOpenChange={setIsFinishConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar partido</DialogTitle>
            <DialogDescription>
              Se cerrara el partido con marcador {currentMatch.homeScore ?? 0} - {currentMatch.awayScore ?? 0}. Esta accion detendra el cronometro.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="destructive" className="flex-1" onClick={() => void handleEndMatch()}>
              Confirmar finalizacion
            </Button>
            <Button variant="outline" onClick={() => setIsFinishConfirmOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {canManage && currentMatch.status === "live" && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-6">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={eventType} onValueChange={(value) => setEventType(value as MatchEvent["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goal">Gol</SelectItem>
                    <SelectItem value="yellow_card">Tarjeta Amarilla</SelectItem>
                    <SelectItem value="red_card">Tarjeta Roja</SelectItem>
                    <SelectItem value="substitution">Sustitucion</SelectItem>
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
                    <SelectItem value={currentMatch.homeTeamId}>{homeTeam?.name}</SelectItem>
                    <SelectItem value={currentMatch.awayTeamId}>{awayTeam?.name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Jugador</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona jugador" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectablePlayers.map((player) => (
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
                  max="130"
                  value={minute}
                  onChange={(e) => setMinute(Number.parseInt(e.target.value, 10) || 1)}
                />
              </div>

              <div className="flex items-end">
                <Button onClick={() => void handleAddEvent()} className="w-full" disabled={isSubmittingEvent}>
                  {isSubmittingEvent ? "Guardando..." : "Registrar"}
                </Button>
              </div>

              <div className="space-y-2 md:col-span-6">
                <Label>Descripcion (opcional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notas del evento" />
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
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="mx-auto mb-2 h-12 w-12" />
              <p>No hay eventos registrados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-center gap-4 rounded-lg bg-muted p-3">
                  <div className="text-2xl">{getEventIcon(event.type)}</div>
                  <div className="flex-1">
                    <p className="font-medium">{getPlayerName(event.playerId)}</p>
                    <p className="text-sm text-muted-foreground">{teams.find((t) => t.id === event.teamId)?.name}</p>
                    {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
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
