"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Match, Team } from "@/lib/types"
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

interface MatchDialogProps {
  match: Match | null
  tournamentId: string
  teams: Team[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (match: Match) => void
}

export function MatchDialog({ match, tournamentId, teams, open, onOpenChange, onSave }: MatchDialogProps) {
  const [formData, setFormData] = useState<Partial<Match>>({
    homeTeamId: "",
    awayTeamId: "",
    date: "",
    time: "",
    venue: "",
    status: "scheduled",
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
      tournamentId: match?.tournamentId || tournamentId,
      homeTeamId: formData.homeTeamId || "",
      awayTeamId: formData.awayTeamId || "",
      date: formData.date || "",
      time: formData.time || "",
      venue: formData.venue || "",
      status: formData.status as Match["status"],
      homeScore: match?.homeScore,
      awayScore: match?.awayScore,
      refereeId: match?.refereeId,
    }

    onSave(matchData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{match ? "Editar Partido" : "Programar Nuevo Partido"}</DialogTitle>
          <DialogDescription>
            {match ? "Modifica los datos del partido" : "Ingresa la información del nuevo encuentro"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="homeTeam">Equipo Local</Label>
              <Select
                value={formData.homeTeamId}
                onValueChange={(value) => setFormData({ ...formData, homeTeamId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona equipo local" />
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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona equipo visitante" />
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
              <Label htmlFor="venue">Cancha/Lugar</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Cancha Municipal #1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{match ? "Guardar Cambios" : "Programar Partido"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
