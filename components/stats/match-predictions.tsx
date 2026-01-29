"use client"

import { useState, useEffect } from "react"
import { getMatches } from "@/lib/storage"
import { predictMatchResult } from "@/lib/stats-calculator"
import type { Team, Standing, Match } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, Shield } from "lucide-react"

interface MatchPredictionsProps {
  tournamentId: string
  teams: Team[]
  standings: Standing[]
}

const SAMPLE_PREDICTIONS = [
  {
    id: "pred-1",
    homeTeam: "Leones FC",
    awayTeam: "Tigres United",
    date: "2025-01-15",
    time: "16:00",
    prediction: { home: 45, draw: 30, away: 25 },
    homeStats: { points: 12, goals: 15, difference: 8 },
    awayStats: { points: 9, goals: 11, difference: 3 },
    confidence: "Alta",
    recommendation: "El equipo local tiene una ligera ventaja por su mejor diferencia de goles",
  },
  {
    id: "pred-2",
    homeTeam: "Águilas Doradas",
    awayTeam: "Pumas del Sur",
    date: "2025-01-16",
    time: "18:30",
    prediction: { home: 35, draw: 25, away: 40 },
    homeStats: { points: 7, goals: 9, difference: -2 },
    awayStats: { points: 11, goals: 13, difference: 5 },
    confidence: "Media",
    recommendation: "El visitante llega en mejor momento y podría llevarse la victoria",
  },
  {
    id: "pred-3",
    homeTeam: "Halcones FC",
    awayTeam: "Jaguares City",
    date: "2025-01-17",
    time: "19:00",
    prediction: { home: 55, draw: 25, away: 20 },
    homeStats: { points: 15, goals: 18, difference: 10 },
    awayStats: { points: 6, goals: 8, difference: -3 },
    confidence: "Muy Alta",
    recommendation: "El local es claro favorito con excelente racha de victorias",
  },
]

export function MatchPredictions({ tournamentId, teams, standings }: MatchPredictionsProps) {
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [showSampleData, setShowSampleData] = useState(false)

  useEffect(() => {
    if (tournamentId) {
      const matches = getMatches(tournamentId)
      const upcoming = matches.filter((m) => m.status === "scheduled").slice(0, 5)
      setUpcomingMatches(upcoming)
      setShowSampleData(upcoming.length === 0)
    }
  }, [tournamentId])

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || "Equipo"
  }

  const getTeamStanding = (teamId: string) => {
    return standings.find((s) => s.teamId === teamId)
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "Muy Alta":
        return <Badge className="bg-green-600">{confidence}</Badge>
      case "Alta":
        return <Badge className="bg-blue-600">{confidence}</Badge>
      case "Media":
        return <Badge className="bg-yellow-600">{confidence}</Badge>
      default:
        return <Badge variant="outline">{confidence}</Badge>
    }
  }

  if (showSampleData) {
    return (
      <div className="space-y-4">
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Predicciones con IA (Datos de Ejemplo)
            </CardTitle>
            <CardDescription>
              Análisis predictivo basado en machine learning y estadísticas avanzadas. Los siguientes son partidos de
              muestra para demostración.
            </CardDescription>
          </CardHeader>
        </Card>

        {SAMPLE_PREDICTIONS.map((sample) => (
          <Card key={sample.id} className="border-l-4 border-l-purple-500">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Predicción IA
                </Badge>
                {getConfidenceBadge(sample.confidence)}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <CardTitle className="text-lg">{sample.homeTeam}</CardTitle>
                </div>
                <Badge variant="outline" className="mx-4">
                  VS
                </Badge>
                <div className="flex-1 text-center">
                  <CardTitle className="text-lg">{sample.awayTeam}</CardTitle>
                </div>
              </div>
              <CardDescription className="text-center">
                {sample.date} - {sample.time}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Victoria Local</span>
                    <span className="font-bold text-green-600">{sample.prediction.home}%</span>
                  </div>
                  <Progress value={sample.prediction.home} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Empate</span>
                    <span className="font-bold text-gray-600">{sample.prediction.draw}%</span>
                  </div>
                  <Progress value={sample.prediction.draw} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Victoria Visitante</span>
                    <span className="font-bold text-blue-600">{sample.prediction.away}%</span>
                  </div>
                  <Progress value={sample.prediction.away} className="h-2" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-4 rounded-lg border">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm mb-1">Análisis del Modelo</p>
                    <p className="text-sm text-muted-foreground">{sample.recommendation}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Estadísticas Local</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Puntos:</span>
                      <span className="font-bold">{sample.homeStats.points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goles:</span>
                      <span className="font-bold">{sample.homeStats.goals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diferencia:</span>
                      <span className="font-bold">{sample.homeStats.difference}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Estadísticas Visitante</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Puntos:</span>
                      <span className="font-bold">{sample.awayStats.points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goles:</span>
                      <span className="font-bold">{sample.awayStats.goals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diferencia:</span>
                      <span className="font-bold">{sample.awayStats.difference}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (upcomingMatches.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No hay partidos próximos</p>
          <p className="text-sm text-muted-foreground">
            Las predicciones se mostrarán cuando haya partidos programados
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Predicciones con IA
          </CardTitle>
          <CardDescription>
            Análisis predictivo basado en rendimiento histórico y estadísticas del torneo
          </CardDescription>
        </CardHeader>
      </Card>

      {upcomingMatches.map((match) => {
        const homeStanding = getTeamStanding(match.homeTeamId)
        const awayStanding = getTeamStanding(match.awayTeamId)

        if (!homeStanding || !awayStanding) return null

        const prediction = predictMatchResult(homeStanding, awayStanding)

        return (
          <Card key={match.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <CardTitle className="text-lg">{getTeamName(match.homeTeamId)}</CardTitle>
                </div>
                <Badge variant="outline" className="mx-4">
                  VS
                </Badge>
                <div className="flex-1 text-center">
                  <CardTitle className="text-lg">{getTeamName(match.awayTeamId)}</CardTitle>
                </div>
              </div>
              <CardDescription className="text-center">
                {new Date(match.date).toLocaleDateString("es-MX")} - {match.time}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Victoria Local</span>
                    <span className="font-bold text-green-600">{prediction.home}%</span>
                  </div>
                  <Progress value={prediction.home} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Empate</span>
                    <span className="font-bold text-gray-600">{prediction.draw}%</span>
                  </div>
                  <Progress value={prediction.draw} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Victoria Visitante</span>
                    <span className="font-bold text-blue-600">{prediction.away}%</span>
                  </div>
                  <Progress value={prediction.away} className="h-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Estadísticas Local</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Puntos:</span>
                      <span className="font-bold">{homeStanding.points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goles:</span>
                      <span className="font-bold">{homeStanding.goalsFor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diferencia:</span>
                      <span className="font-bold">{homeStanding.goalDifference}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Estadísticas Visitante</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Puntos:</span>
                      <span className="font-bold">{awayStanding.points}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goles:</span>
                      <span className="font-bold">{awayStanding.goalsFor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Diferencia:</span>
                      <span className="font-bold">{awayStanding.goalDifference}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
