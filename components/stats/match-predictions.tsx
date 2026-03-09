"use client"

import type { Standing, Team } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface MatchPredictionsProps {
  tournamentId: string
  teams: Team[]
  standings: Standing[]
}

export function MatchPredictions({ tournamentId, teams, standings }: MatchPredictionsProps) {
  void tournamentId
  void teams
  void standings

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predicciones</CardTitle>
        <CardDescription>Esta funcionalidad estara disponible pronto.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <span className="rounded-full border border-green-300 bg-green-100 px-4 py-1 text-sm font-semibold text-green-800">
          Proximamente
        </span>
        <img src="/happy.gif" alt="Happy" className="h-40 w-40 rounded-lg object-cover" />
      </CardContent>
    </Card>
  )
}
