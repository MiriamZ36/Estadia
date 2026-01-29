"use client"

import { useState, useEffect } from "react"
import { getTournaments, getMatches, getTeams, getPlayers, getMatchEvents } from "@/lib/storage"
import { calculateStandings, calculatePlayerStats, getTeamForm } from "@/lib/stats-calculator"
import type { Tournament, Team, Standing } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trophy, Target, TrendingUp, BarChart3 } from "lucide-react"
import { MatchPredictions } from "./match-predictions"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export function StatisticsView() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>("")
  const [standings, setStandings] = useState<Standing[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [topScorers, setTopScorers] = useState<any[]>([])
  const [goalsChartData, setGoalsChartData] = useState<any[]>([])
  const [performanceChartData, setPerformanceChartData] = useState<any[]>([])
  const [resultsDistribution, setResultsDistribution] = useState<any[]>([])

  useEffect(() => {
    const tournamentsData = getTournaments()
    setTournaments(tournamentsData)
    if (tournamentsData.length > 0 && !selectedTournament) {
      setSelectedTournament(tournamentsData[0].id)
    }
  }, [])

  useEffect(() => {
    if (selectedTournament) {
      loadStatistics()
    }
  }, [selectedTournament])

  const loadStatistics = () => {
    const teamsData = getTeams(selectedTournament)
    const matches = getMatches(selectedTournament)
    const standingsData = calculateStandings(teamsData, matches)

    setTeams(teamsData)
    setStandings(standingsData)

    const allPlayers = teamsData.flatMap((team) => getPlayers(team.id))
    const allEvents = matches.flatMap((match) => {
      return getMatchEvents(match.id)
    })

    const playerStats = calculatePlayerStats(allPlayers, allEvents)
    const topScorersData = playerStats
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 10)

    setTopScorers(topScorersData)

    const goalsData = standingsData.slice(0, 6).map((s) => ({
      name: teamsData.find((t) => t.id === s.teamId)?.name || "Equipo",
      golesFavor: s.goalsFor,
      golesContra: s.goalsAgainst,
    }))
    setGoalsChartData(goalsData)

    const performanceData = standingsData.slice(0, 6).map((s) => ({
      name: teamsData.find((t) => t.id === s.teamId)?.name || "Equipo",
      ganados: s.won,
      empatados: s.drawn,
      perdidos: s.lost,
    }))
    setPerformanceChartData(performanceData)

    const totalMatches = matches.filter((m) => m.status === "finished").length
    const totalWins = standingsData.reduce((acc, s) => acc + s.won, 0)
    const totalDraws = standingsData.reduce((acc, s) => acc + s.drawn, 0)
    const totalLosses = standingsData.reduce((acc, s) => acc + s.lost, 0)

    setResultsDistribution([
      { name: "Victorias", value: totalWins, color: "#10b981" },
      { name: "Empates", value: totalDraws, color: "#f59e0b" },
      { name: "Derrotas", value: totalLosses, color: "#ef4444" },
    ])
  }

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || "Equipo"
  }

  const getFormBadge = (result: string) => {
    if (result === "W") return <Badge className="bg-green-600">G</Badge>
    if (result === "L") return <Badge className="bg-red-600">P</Badge>
    return <Badge className="bg-gray-600">E</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Estadísticas y Análisis</h2>
        <p className="text-muted-foreground">Consulta tablas de posiciones, goleadores y predicciones</p>
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
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Selecciona un torneo para ver las estadísticas</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="standings">
              <Trophy className="h-4 w-4 mr-2" />
              Tabla
            </TabsTrigger>
            <TabsTrigger value="charts">
              <BarChart3 className="h-4 w-4 mr-2" />
              Gráficas
            </TabsTrigger>
            <TabsTrigger value="scorers">
              <Target className="h-4 w-4 mr-2" />
              Goleadores
            </TabsTrigger>
            <TabsTrigger value="predictions">
              <TrendingUp className="h-4 w-4 mr-2" />
              Predicciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tabla de Posiciones</CardTitle>
                <CardDescription>Clasificación actualizada del torneo</CardDescription>
              </CardHeader>
              <CardContent>
                {standings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay datos suficientes para generar la tabla</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Pos</th>
                          <th className="text-left py-2 px-2">Equipo</th>
                          <th className="text-center py-2 px-2">PJ</th>
                          <th className="text-center py-2 px-2">G</th>
                          <th className="text-center py-2 px-2">E</th>
                          <th className="text-center py-2 px-2">P</th>
                          <th className="text-center py-2 px-2">GF</th>
                          <th className="text-center py-2 px-2">GC</th>
                          <th className="text-center py-2 px-2">DG</th>
                          <th className="text-center py-2 px-2 font-bold">Pts</th>
                          <th className="text-center py-2 px-2">Forma</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((standing, index) => {
                          const form = getTeamForm(standing.teamId, getMatches(selectedTournament))
                          return (
                            <tr key={standing.teamId} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-2">
                                <span className="font-bold">{index + 1}</span>
                              </td>
                              <td className="py-3 px-2 font-medium">{getTeamName(standing.teamId)}</td>
                              <td className="text-center py-3 px-2">{standing.played}</td>
                              <td className="text-center py-3 px-2">{standing.won}</td>
                              <td className="text-center py-3 px-2">{standing.drawn}</td>
                              <td className="text-center py-3 px-2">{standing.lost}</td>
                              <td className="text-center py-3 px-2">{standing.goalsFor}</td>
                              <td className="text-center py-3 px-2">{standing.goalsAgainst}</td>
                              <td className="text-center py-3 px-2">{standing.goalDifference}</td>
                              <td className="text-center py-3 px-2 font-bold">{standing.points}</td>
                              <td className="py-3 px-2">
                                <div className="flex gap-1 justify-center">
                                  {form.split("").map((result, i) => (
                                    <span key={i}>{getFormBadge(result)}</span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Goles por Equipo</CardTitle>
                  <CardDescription>Comparación de goles a favor y en contra</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={goalsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="golesFavor" fill="#10b981" name="Goles a Favor" />
                      <Bar dataKey="golesContra" fill="#ef4444" name="Goles en Contra" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Resultados</CardTitle>
                  <CardDescription>Total de victorias, empates y derrotas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={resultsDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {resultsDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Rendimiento de Equipos</CardTitle>
                <CardDescription>Partidos ganados, empatados y perdidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ganados" stackId="a" fill="#10b981" name="Ganados" />
                    <Bar dataKey="empatados" stackId="a" fill="#f59e0b" name="Empatados" />
                    <Bar dataKey="perdidos" stackId="a" fill="#ef4444" name="Perdidos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scorers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tabla de Goleadores</CardTitle>
                <CardDescription>Jugadores con más goles en el torneo</CardDescription>
              </CardHeader>
              <CardContent>
                {topScorers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-2" />
                    <p>Aún no hay goles registrados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topScorers.map((player, index) => (
                      <div key={player.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 text-white font-bold text-xl">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg">{player.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getTeamName(player.teamId)} - {player.position}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-green-600">{player.goals}</div>
                          <div className="text-xs text-muted-foreground">goles</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            <MatchPredictions tournamentId={selectedTournament} teams={teams} standings={standings} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
