"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getTournaments, getMatches, getTeams, saveMatch } from "@/lib/storage"
import type { Tournament, Match, Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, CalendarIcon, Clock } from "lucide-react"
import { MatchDialog } from "./match-dialog"
import { MatchDetail } from "./match-detail"

export function MatchList() {
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>("")
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [viewingMatchId, setViewingMatchId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const tournamentsData = getTournaments()
    setTournaments(tournamentsData)
    if (tournamentsData.length > 0 && !selectedTournament) {
      setSelectedTournament(tournamentsData[0].id)
    }
  }, [])

  useEffect(() => {
    if (selectedTournament) {
      loadMatches()
      const teamsData = getTeams(selectedTournament)
      setTeams(teamsData)
    }
  }, [selectedTournament])

  const loadMatches = () => {
    if (selectedTournament) {
      const data = getMatches(selectedTournament)
      setMatches(data)
    }
  }

  const handleSave = (match: Match) => {
    saveMatch(match)
    loadMatches()
    setIsDialogOpen(false)
    setSelectedMatch(null)
  }

  const handleCreate = () => {
    setSelectedMatch(null)
    setIsDialogOpen(true)
  }

  const getTeamName = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    return team?.name || "Equipo"
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

  if (viewingMatchId) {
    const match = matches.find((m) => m.id === viewingMatchId)
    if (match) {
      return <MatchDetail match={match} teams={teams} onBack={() => setViewingMatchId(null)} onUpdate={handleSave} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Calendario de Partidos</h2>
          <p className="text-muted-foreground">Programa y gestiona los encuentros del torneo</p>
        </div>
        {canManage && selectedTournament && teams.length >= 2 && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Programar Partido
          </Button>
        )}
      </div>

      <div className="flex-1">
        <Select value={selectedTournament} onValueChange={setSelectedTournament}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un torneo" />
          </SelectTrigger>
          <SelectContent>
            {tournaments.map((tournament) => (
              <SelectItem key={tournament.id} value={tournament.id}>
                {tournament.name} - Fútbol {tournament.format}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedTournament ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Selecciona un torneo para ver los partidos</p>
          </CardContent>
        </Card>
      ) : teams.length < 2 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay suficientes equipos</p>
            <p className="text-sm text-muted-foreground">Se necesitan al menos 2 equipos para programar partidos</p>
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay partidos programados</p>
            <p className="text-sm text-muted-foreground mb-4">Comienza programando el primer encuentro</p>
            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Programar Partido
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <Card
              key={match.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setViewingMatchId(match.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{match.venue}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-base">
                      <span className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(match.date).toLocaleDateString("es-MX")}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {match.time}
                      </span>
                    </CardDescription>
                  </div>
                  {getStatusBadge(match.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <p className="font-bold text-lg">{getTeamName(match.homeTeamId)}</p>
                  </div>
                  <div className="px-6">
                    {match.status === "finished" ? (
                      <div className="text-3xl font-bold">
                        {match.homeScore} - {match.awayScore}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground">VS</div>
                    )}
                  </div>
                  <div className="flex-1 text-center">
                    <p className="font-bold text-lg">{getTeamName(match.awayTeamId)}</p>
                  </div>
                </div>
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
      />
    </div>
  )
}
