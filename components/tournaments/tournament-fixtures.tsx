"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getMatches, saveMatch, getReferees } from "@/lib/storage"
import type { Tournament, Team, Match, Referee } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Calendar, MapPin, Users, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { FixtureDialog } from "./fixture-dialog"

interface TournamentFixturesProps {
  tournament: Tournament
  teams: Team[]
}

export function TournamentFixtures({ tournament, teams }: TournamentFixturesProps) {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [referees, setReferees] = useState<Referee[]>([])

  useEffect(() => {
    loadMatches()
    setReferees(getReferees())
  }, [tournament.id])

  const loadMatches = () => {
    const tournamentMatches = getMatches(tournament.id)
    setMatches(tournamentMatches)
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

  const handleEdit = (match: Match) => {
    setSelectedMatch(match)
    setIsDialogOpen(true)
  }

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || "Equipo Desconocido"
  }

  const getTeamLogo = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.logo
  }

  const getRefereeName = (refereeId?: string) => {
    if (!refereeId) return "Sin árbitro"
    return referees.find((r) => r.id === refereeId)?.name || "Árbitro Desconocido"
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

    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  const canManage = user?.role === "admin" || user?.role === "referee"

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Calendario de Encuentros ({matches.length})</h3>
          <p className="text-sm text-muted-foreground">Programa y gestiona los partidos del torneo</p>
        </div>
        {canManage && teams.length >= 2 && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Encuentro
          </Button>
        )}
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay encuentros programados</p>
            <p className="text-sm text-muted-foreground mb-4">Crea el calendario de partidos para el torneo</p>
            {canManage && teams.length >= 2 && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Encuentro
              </Button>
            )}
            {teams.length < 2 && (
              <p className="text-sm text-muted-foreground">Se requieren al menos 2 equipos para crear encuentros</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <Card key={match.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(match.date).toLocaleDateString("es-MX", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="ml-2">{match.time}</span>
                  </div>
                  {getStatusBadge(match.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      {getTeamLogo(match.homeTeamId) ? (
                        <img
                          src={getTeamLogo(match.homeTeamId) || "/placeholder.svg"}
                          alt={getTeamName(match.homeTeamId)}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <Trophy className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{getTeamName(match.homeTeamId)}</p>
                      <p className="text-sm text-muted-foreground">Local</p>
                    </div>
                    {match.status !== "scheduled" && <div className="text-3xl font-bold">{match.homeScore ?? 0}</div>}
                  </div>

                  <div className="text-2xl font-bold text-muted-foreground px-4">VS</div>

                  <div className="flex items-center gap-3 flex-1 flex-row-reverse">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                      {getTeamLogo(match.awayTeamId) ? (
                        <img
                          src={getTeamLogo(match.awayTeamId) || "/placeholder.svg"}
                          alt={getTeamName(match.awayTeamId)}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <Trophy className="h-6 w-6 text-secondary" />
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-semibold">{getTeamName(match.awayTeamId)}</p>
                      <p className="text-sm text-muted-foreground">Visitante</p>
                    </div>
                    {match.status !== "scheduled" && <div className="text-3xl font-bold">{match.awayScore ?? 0}</div>}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{match.venue}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{getRefereeName(match.refereeId)}</span>
                    </div>
                  </div>
                  {canManage && (
                    <Button variant="outline" size="sm" onClick={() => handleEdit(match)}>
                      Gestionar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FixtureDialog
        match={selectedMatch}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        tournament={tournament}
        teams={teams}
        referees={referees}
      />
    </div>
  )
}
