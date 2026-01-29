"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Match, Tournament, Team, Referee } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FixtureDialogProps {
  match: Match | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (match: Match) => void
  tournament: Tournament
  teams: Team[]
  referees: Referee[]
}

export function FixtureDialog({ match, open, onOpenChange, onSave, tournament, teams, referees }: FixtureDialogProps) {
  const [formData, setFormData] = useState<Partial<Match>>({
    homeTeamId: "",
    awayTeamId: "",
    date: "",
    time: "",
    venue: "",
    status: "scheduled",
    refereeId: "",
  })

  useEffect(() => {
    if (match) {
      setFormData(match)
    } else {
      setFormData({
        homeTeamId: "",
        awayTeamId: "",
        date: "",
        time: "",
        venue: "",
        status: "scheduled",
        refereeId: "",
      })
    }
  }, [match])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.homeTeamId === formData.awayTeamId) {
      alert("Un equipo no puede jugar contra sí mismo")
      return
    }

    const matchData: Match = {
      id: match?.id || Date.now().toString(),
      tournamentId: tournament.id,
      homeTeamId: formData.homeTeamId || "",
      awayTeamId: formData.awayTeamId || "",
      date: formData.date || "",
      time: formData.time || "",
      venue: formData.venue || "",
      status: formData.status as Match["status"],
      refereeId: formData.refereeId || undefined,
      homeScore: formData.homeScore,
      awayScore: formData.awayScore,
    }

    onSave(matchData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{match ? "Gestionar Encuentro" : "Crear Nuevo Encuentro"}</DialogTitle>
          <DialogDescription>
            {match
              ? "Edita los detalles del encuentro y actualiza los resultados"
              : "Programa un nuevo partido para el torneo"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeTeam">Equipo Local</Label>
                <Select
                  value={formData.homeTeamId}
                  onValueChange={(value) => setFormData({ ...formData, homeTeamId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="awayTeam">Equipo Visitante</Label>
                <Select
                  value={formData.awayTeamId}
                  onValueChange={(value) => setFormData({ ...formData, awayTeamId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Lugar</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Nombre del estadio o cancha"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referee">Árbitro</Label>
              <Select
                value={formData.refereeId}
                onValueChange={(value) => setFormData({ ...formData, refereeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar árbitro (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {referees.map((referee) => (
                    <SelectItem key={referee.id} value={referee.id}>
                      {referee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Match["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programado</SelectItem>
                  <SelectItem value="live">En vivo</SelectItem>
                  <SelectItem value="finished">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.status === "live" || formData.status === "finished") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="homeScore">Goles Local</Label>
                  <Input
                    id="homeScore"
                    type="number"
                    min="0"
                    value={formData.homeScore ?? ""}
                    onChange={(e) => setFormData({ ...formData, homeScore: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awayScore">Goles Visitante</Label>
                  <Input
                    id="awayScore"
                    type="number"
                    min="0"
                    value={formData.awayScore ?? ""}
                    onChange={(e) => setFormData({ ...formData, awayScore: Number.parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{match ? "Guardar Cambios" : "Crear Encuentro"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
