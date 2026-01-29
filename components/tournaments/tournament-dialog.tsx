"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Tournament } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TournamentDialogProps {
  tournament: Tournament | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (tournament: Tournament) => void
  userId: string
}

export function TournamentDialog({ tournament, open, onOpenChange, onSave, userId }: TournamentDialogProps) {
  const [formData, setFormData] = useState<Partial<Tournament>>({
    name: "",
    format: "11",
    startDate: "",
    endDate: "",
    status: "upcoming",
    rules: "",
  })

  useEffect(() => {
    if (tournament) {
      setFormData(tournament)
    } else {
      setFormData({
        name: "",
        format: "11",
        startDate: "",
        endDate: "",
        status: "upcoming",
        rules: "",
      })
    }
  }, [tournament])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const tournamentData: Tournament = {
      id: tournament?.id || Date.now().toString(),
      name: formData.name || "",
      format: formData.format as "5" | "7" | "11",
      startDate: formData.startDate || "",
      endDate: formData.endDate || "",
      status: formData.status as Tournament["status"],
      organizerId: tournament?.organizerId || userId,
      rules: formData.rules,
    }

    onSave(tournamentData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{tournament ? "Editar Torneo" : "Crear Nuevo Torneo"}</DialogTitle>
          <DialogDescription>
            {tournament ? "Modifica los datos del torneo" : "Ingresa la información del nuevo torneo de fútbol"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Torneo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Liga Amateur Orizaba 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <Select
                value={formData.format}
                onValueChange={(value) => setFormData({ ...formData, format: value as "5" | "7" | "11" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Fútbol 5</SelectItem>
                  <SelectItem value="7">Fútbol 7</SelectItem>
                  <SelectItem value="11">Fútbol 11</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Tournament["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Próximo</SelectItem>
                  <SelectItem value="active">En curso</SelectItem>
                  <SelectItem value="completed">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Reglas (opcional)</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="Describe las reglas especiales del torneo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{tournament ? "Guardar Cambios" : "Crear Torneo"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
