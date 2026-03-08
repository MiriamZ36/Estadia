"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
  onSave: (tournament: Tournament) => Promise<void>
  userId: string
  isSaving?: boolean
}

export function TournamentDialog({
  tournament,
  open,
  onOpenChange,
  onSave,
  userId,
  isSaving = false,
}: TournamentDialogProps) {
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
      return
    }

    setFormData({
      name: "",
      format: "11",
      startDate: "",
      endDate: "",
      status: "upcoming",
      rules: "",
    })
  }, [tournament, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const tournamentData: Tournament = {
      id: tournament?.id || "",
      name: formData.name || "",
      format: (formData.format as "5" | "7" | "11") || "11",
      startDate: formData.startDate || "",
      endDate: formData.endDate || "",
      status: (formData.status as Tournament["status"]) || "upcoming",
      organizerId: tournament?.organizerId || userId,
      rules: formData.rules || undefined,
      teamIds: tournament?.teamIds || [],
    }

    await onSave(tournamentData)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{tournament ? "Editar Torneo" : "Crear Nuevo Torneo"}</DialogTitle>
          <DialogDescription>
            {tournament ? "Modifica los datos del torneo" : "Ingresa la informacion del nuevo torneo de futbol"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Torneo</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Liga Amateur Orizaba 2026"
                required
                disabled={isSaving}
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
                  <SelectItem value="5">Futbol 5</SelectItem>
                  <SelectItem value="7">Futbol 7</SelectItem>
                  <SelectItem value="11">Futbol 11</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ""}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ""}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  disabled={isSaving}
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
                  <SelectItem value="upcoming">Proximo</SelectItem>
                  <SelectItem value="active">En curso</SelectItem>
                  <SelectItem value="completed">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Reglas (opcional)</Label>
              <Textarea
                id="rules"
                value={formData.rules || ""}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="Describe las reglas especiales del torneo..."
                rows={3}
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : tournament ? "Guardar Cambios" : "Crear Torneo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
