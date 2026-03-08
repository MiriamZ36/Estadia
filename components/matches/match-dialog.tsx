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

interface MatchDialogProps {
  match: Match | null
  tournamentId: string
  teams: Team[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (match: Match) => Promise<void>
  isSaving?: boolean
}

export function MatchDialog({ match, tournamentId, teams, open, onOpenChange, onSave, isSaving = false }: MatchDialogProps) {
  const [homeTeamSearch, setHomeTeamSearch] = useState("")
  const [awayTeamSearch, setAwayTeamSearch] = useState("")
  const [validationMessage, setValidationMessage] = useState("")
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
    setHomeTeamSearch("")
    setAwayTeamSearch("")
    setValidationMessage("")
  }, [match, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.homeTeamId || !formData.awayTeamId) {
      setValidationMessage("Debes seleccionar equipo local y visitante.")
      return
    }

    if (formData.homeTeamId === formData.awayTeamId) {
      setValidationMessage("El equipo local y visitante no pueden ser el mismo.")
      return
    }
    setValidationMessage("")

    const matchData: Match = {
      id: match?.id || "",
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

    await onSave(matchData)
  }

  const availableHomeTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(homeTeamSearch.trim().toLowerCase())
    const differentFromAway = !formData.awayTeamId || team.id !== formData.awayTeamId
    return matchesSearch && differentFromAway
  })

  const availableAwayTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(awayTeamSearch.trim().toLowerCase())
    const differentFromHome = !formData.homeTeamId || team.id !== formData.homeTeamId
    return matchesSearch && differentFromHome
  })

  const selectedHomeTeamName = teams.find((team) => team.id === formData.homeTeamId)?.name
  const selectedAwayTeamName = teams.find((team) => team.id === formData.awayTeamId)?.name

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] w-[95vw] !max-w-[980px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{match ? "Editar Partido" : "Programar Nuevo Partido"}</DialogTitle>
          <DialogDescription>
            {match ? "Modifica los datos del partido" : "Ingresa la información del nuevo encuentro"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4">
            {validationMessage && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {validationMessage}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="homeTeam">Equipo Local</Label>
              <Input
                id="homeTeamSearch"
                value={homeTeamSearch}
                onChange={(e) => setHomeTeamSearch(e.target.value)}
                placeholder="Buscar equipo local..."
                disabled={isSaving}
              />
              <div className="max-h-36 overflow-y-auto rounded-md border">
                <button
                  type="button"
                  className="w-full border-b px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
                  onClick={() => {
                    setFormData({ ...formData, homeTeamId: "" })
                    setHomeTeamSearch("")
                  }}
                  disabled={isSaving}
                >
                  Quitar seleccion
                </button>
                {availableHomeTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setValidationMessage("")
                      setFormData({ ...formData, homeTeamId: team.id })
                      setHomeTeamSearch(team.name)
                    }}
                    disabled={isSaving}
                  >
                    {team.name}
                  </button>
                ))}
                {availableHomeTeams.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No hay equipos disponibles</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Seleccionado: {selectedHomeTeamName || "Ninguno"}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="awayTeam">Equipo Visitante</Label>
              <Input
                id="awayTeamSearch"
                value={awayTeamSearch}
                onChange={(e) => setAwayTeamSearch(e.target.value)}
                placeholder="Buscar equipo visitante..."
                disabled={isSaving}
              />
              <div className="max-h-36 overflow-y-auto rounded-md border">
                <button
                  type="button"
                  className="w-full border-b px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
                  onClick={() => {
                    setFormData({ ...formData, awayTeamId: "" })
                    setAwayTeamSearch("")
                  }}
                  disabled={isSaving}
                >
                  Quitar seleccion
                </button>
                {availableAwayTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setValidationMessage("")
                      setFormData({ ...formData, awayTeamId: team.id })
                      setAwayTeamSearch(team.name)
                    }}
                    disabled={isSaving}
                  >
                    {team.name}
                  </button>
                ))}
                {availableAwayTeams.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No hay equipos disponibles</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Seleccionado: {selectedAwayTeamName || "Ninguno"}</p>
            </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  disabled={isSaving}
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
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="venue">Cancha/Lugar</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Cancha Municipal #1"
                  disabled={isSaving}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : match ? "Guardar Cambios" : "Programar Partido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
