"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarIcon, Clock, Pencil, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Match, Team, Tournament } from "@/lib/types"
import { MatchDialog } from "./match-dialog"
import { MatchDetail } from "./match-detail"
import { ProgressDialog } from "@/components/ui/progress-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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

type MatchStatusFilter = "active" | "all" | "scheduled" | "live" | "finished"
type MatchClockState = {
  elapsedSeconds: number
  isPaused: boolean
  updatedAt: number
}

const MATCH_CLOCK_STORAGE_PREFIX = "match-stopwatch:"

function formatStopwatch(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function MatchList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>("")
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [viewingMatchId, setViewingMatchId] = useState<string | null>(null)
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progressState, setProgressState] = useState<ProgressState>(idleProgress)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<MatchStatusFilter>("active")
  const [clockTick, setClockTick] = useState(0)

  useEffect(() => {
    void loadTournaments(true)
  }, [])

  useEffect(() => {
    if (!selectedTournament) return
    const loadTournamentData = async () => {
      openProgress("Cargando partidos", "Consultando partidos y equipos del torneo seleccionado.")
      await Promise.all([loadMatches(selectedTournament), loadTeams(selectedTournament)])
      closeProgress()
    }

    void loadTournamentData()
  }, [selectedTournament])

  useEffect(() => {
    const hasLiveMatches = matches.some((match) => match.status === "live")
    if (!hasLiveMatches) return

    const interval = window.setInterval(() => {
      setClockTick((previous) => previous + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [matches])

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

  const loadTournaments = async (showProgress = false) => {
    if (showProgress) {
      openProgress("Cargando torneos", "Consultando torneos disponibles.")
    }

    const response = await fetch("/api/tournaments", {
      cache: "no-store",
    })
    const result = await response.json()

    if (showProgress) {
      closeProgress()
    }

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible cargar torneos",
        description: result.error || "Verifica la conexion con la base de datos.",
      })
      return
    }

    const tournamentsData: Tournament[] = result.tournaments || []
    setTournaments(tournamentsData)

    if (tournamentsData.length > 0 && !selectedTournament) {
      setSelectedTournament(tournamentsData[0].id)
    }
  }

  const loadMatches = async (tournamentId: string) => {
    const response = await fetch(`/api/matches?tournamentId=${tournamentId}`, {
      cache: "no-store",
    })
    const result = await response.json()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible cargar partidos",
        description: result.error || "Verifica tu conexion y la sesion actual.",
      })
      return
    }

    setMatches(result.matches || [])
  }

  const loadTeams = async (tournamentId: string) => {
    const response = await fetch(`/api/teams?tournamentId=${tournamentId}`, {
      cache: "no-store",
    })
    const result = await response.json()

    if (!response.ok) {
      return
    }

    setTeams(result.teams || [])
  }

  const handleSave = async (match: Match) => {
    const isEditing = Boolean(match.id)
    setIsSaving(true)
    openProgress(
      isEditing ? "Actualizando partido" : "Programando partido",
      isEditing ? "Guardando cambios del partido en la base de datos." : "Validando reglas y registrando partido.",
    )

    const response = await fetch(isEditing ? `/api/matches/${match.id}` : "/api/matches", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(match),
    })
    const result = await response.json()
    closeProgress()
    setIsSaving(false)

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible guardar el partido",
        description: result.error || "La operacion no pudo completarse.",
      })
      return
    }

    if (selectedTournament) {
      await loadMatches(selectedTournament)
    }
    setIsDialogOpen(false)
    setSelectedMatch(null)

    toast({
      title: isEditing ? "Partido actualizado" : "Partido programado",
      description: `El partido fue ${isEditing ? "actualizado" : "registrado"} correctamente.`,
    })
  }

  const handleDelete = async () => {
    if (!matchToDelete) return

    openProgress("Eliminando partido", "Estamos eliminando el partido seleccionado.")
    const response = await fetch(`/api/matches/${matchToDelete.id}`, {
      method: "DELETE",
    })
    const result = await response.json()
    closeProgress()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible eliminar el partido",
        description: result.error || "La eliminacion no pudo completarse.",
      })
      return
    }

    setMatchToDelete(null)
    if (selectedTournament) {
      await loadMatches(selectedTournament)
    }

    toast({
      title: "Partido eliminado",
      description: "El partido fue eliminado correctamente.",
    })
  }

  const handleCreate = () => {
    setSelectedMatch(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (match: Match) => {
    setSelectedMatch(match)
    setIsDialogOpen(true)
  }

  const handleView = (matchId: string) => {
    setViewingMatchId(matchId)
  }

  const getTeamName = (teamId: string) => {
    const team = teams.find((item) => item.id === teamId)
    return team?.name || "Equipo"
  }

  const getLiveElapsedSeconds = (match: Match) => {
    if (match.status !== "live" || typeof window === "undefined") return null
    const raw = window.localStorage.getItem(`${MATCH_CLOCK_STORAGE_PREFIX}${match.id}`)
    if (!raw) {
      if (!match.updatedAt) return 0
      return Math.max(0, Math.floor((Date.now() - new Date(match.updatedAt).getTime()) / 1000))
    }

    try {
      const parsed = JSON.parse(raw) as MatchClockState
      const safeElapsed = Number.isFinite(parsed.elapsedSeconds) ? Math.max(0, Math.floor(parsed.elapsedSeconds)) : 0
      const safeIsPaused = Boolean(parsed.isPaused)
      const safeUpdatedAt = Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : Date.now()
      const elapsedWhileAway = safeIsPaused ? 0 : Math.max(0, Math.floor((Date.now() - safeUpdatedAt) / 1000))

      return safeElapsed + elapsedWhileAway
    } catch {
      return 0
    }
  }

  const getStatusBadge = (status: Match["status"]) => {
    const variants = {
      scheduled: "secondary",
      live: "default",
      finished: "outline",
    } as const

    const labels = {
      scheduled: "Programado",
      live: "En vivo",
      finished: "Finalizado",
    }

    return <Badge variant={variants[status] || "secondary"}>{labels[status]}</Badge>
  }

  const canManage = user?.role === "admin" || user?.role === "referee"
  const filteredMatches = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return matches.filter((match) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? match.status !== "finished" : match.status === statusFilter)

      if (!matchesStatus) return false
      if (!normalizedSearch) return true

      const homeTeam = getTeamName(match.homeTeamId).toLowerCase()
      const awayTeam = getTeamName(match.awayTeamId).toLowerCase()
      const venue = (match.venue || "").toLowerCase()
      const date = new Date(match.date).toLocaleDateString("es-MX").toLowerCase()
      const time = (match.time || "").toLowerCase()
      const statusLabel =
        match.status === "scheduled" ? "programado" : match.status === "live" ? "en vivo" : "finalizado"

      return [homeTeam, awayTeam, venue, date, time, statusLabel].some((value) => value.includes(normalizedSearch))
    })
  }, [matches, searchTerm, statusFilter, teams])

  if (viewingMatchId) {
    const viewingMatch = matches.find((item) => item.id === viewingMatchId)
    if (viewingMatch) {
      return (
        <MatchDetail
          match={viewingMatch}
          teams={teams}
          onBack={() => setViewingMatchId(null)}
          onMatchUpdated={async (_match: Match) => {
            if (selectedTournament) {
              await loadMatches(selectedTournament)
            }
          }}
        />
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-3xl font-bold">Calendario de Partidos</h2>
          <p className="text-muted-foreground">Programa y gestiona los encuentros del torneo</p>
        </div>
        {canManage && selectedTournament && teams.length >= 2 && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Programar Partido
          </Button>
        )}
      </div>

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

      {selectedTournament && (
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por equipo, sede, fecha u hora"
          />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MatchStatusFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activos (oculta finalizados)</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="scheduled">Solo programados</SelectItem>
              <SelectItem value="live">Solo en vivo</SelectItem>
              <SelectItem value="finished">Solo finalizados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!selectedTournament ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Selecciona un torneo para ver los partidos</p>
          </CardContent>
        </Card>
      ) : teams.length < 2 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">No hay suficientes equipos</p>
            <p className="text-sm text-muted-foreground">Se necesitan al menos 2 equipos del torneo para programar partidos</p>
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">No hay partidos programados</p>
            <p className="mb-4 text-sm text-muted-foreground">Comienza programando el primer encuentro</p>
            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Programar Partido
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredMatches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">No hay partidos para estos filtros</p>
            <p className="text-sm text-muted-foreground">Ajusta la busqueda o cambia el filtro de estado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <Card key={match.id} className="cursor-pointer transition-shadow hover:shadow-lg" onClick={() => handleView(match.id)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2 text-xl">{match.venue}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-base">
                      <span className="flex items-center">
                        <CalendarIcon className="mr-1 h-4 w-4" />
                        {new Date(match.date).toLocaleDateString("es-MX")}
                      </span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        {match.time}
                      </span>
                    </CardDescription>
                    {match.status === "live" && clockTick >= 0 && (
                      <p className="mt-2 text-sm font-semibold text-green-700">Cronometro: {formatStopwatch(getLiveElapsedSeconds(match) ?? 0)}</p>
                    )}
                  </div>
                  {getStatusBadge(match.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold">{getTeamName(match.homeTeamId)}</p>
                  </div>
                  <div className="px-6">
                    {match.status === "finished" ? (
                      <div className="text-3xl font-bold">
                        {match.homeScore ?? 0} - {match.awayScore ?? 0}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground">VS</div>
                    )}
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold">{getTeamName(match.awayTeamId)}</p>
                  </div>
                </div>
                {canManage && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleEdit(match)
                      }}
                      className="flex-1"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation()
                        setMatchToDelete(match)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MatchDialog
        match={selectedMatch}
        tournamentId={selectedTournament}
        teams={teams}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <Dialog open={Boolean(matchToDelete)} onOpenChange={(open) => !open && setMatchToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar partido</DialogTitle>
            <DialogDescription>
              {matchToDelete
                ? `Se eliminara el partido ${getTeamName(matchToDelete.homeTeamId)} vs ${getTeamName(matchToDelete.awayTeamId)}.`
                : "Confirma la eliminacion del partido."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => void handleDelete()} className="flex-1">
              Eliminar
            </Button>
            <Button variant="outline" onClick={() => setMatchToDelete(null)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProgressDialog open={progressState.open} title={progressState.title} description={progressState.description} />
    </div>
  )
}
