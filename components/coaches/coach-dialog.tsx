"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Coach, Team } from "@/lib/types"
import { FileUploadInput } from "@/components/file-upload-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const COACH_SPECIALTIES = [
  "Direccion Tecnica General",
  "Tactica Defensiva",
  "Tactica Ofensiva",
  "Preparacion Fisica",
  "Entrenamiento de Porteros",
  "Analisis de Rival",
  "Formacion Juvenil",
  "Balon Parado",
  "Psicologia Deportiva",
]

interface CoachDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coach: Coach | null
  teams: Team[]
  onSave: (coach: Coach) => Promise<void>
  isSaving?: boolean
}

export function CoachDialog({ open, onOpenChange, coach, teams, onSave, isSaving = false }: CoachDialogProps) {
  const [teamSearch, setTeamSearch] = useState("")
  const [formData, setFormData] = useState<Partial<Coach>>({
    name: "",
    license: "",
    experience: 0,
    email: "",
    phone: "",
    photo: "",
    specialty: "",
    teamId: "",
  })

  useEffect(() => {
    if (coach) {
      setFormData(coach)
      setTeamSearch(coach.teamName || "")
    } else {
      setFormData({
        name: "",
        license: "",
        experience: 0,
        email: "",
        phone: "",
        photo: "",
        specialty: "",
        teamId: "",
      })
      setTeamSearch("")
    }
  }, [coach, open])

  const filteredTeams = teams.filter((team) => team.name.toLowerCase().includes(teamSearch.trim().toLowerCase()))
  const selectedTeamName = teams.find((team) => team.id === formData.teamId)?.name

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Coach = {
      id: coach?.id || "",
      name: formData.name!,
      license: formData.license,
      experience: formData.experience!,
      email: formData.email!,
      phone: formData.phone,
      photo: formData.photo,
      specialty: formData.specialty,
      teamId: formData.teamId || undefined,
    }

    await onSave(payload)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] w-[95vw] !max-w-[1200px] overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coach ? "Editar Entrenador" : "Nuevo Entrenador"}</DialogTitle>
          <DialogDescription>Complete la información del entrenador</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-3 text-sm font-medium">Vista previa</p>
                <Avatar className="mx-auto h-40 w-40 border">
                  <AvatarImage src={formData.photo || "/placeholder.svg"} alt={formData.name || "Entrenador"} />
                  <AvatarFallback>DT</AvatarFallback>
                </Avatar>
              </div>
              <FileUploadInput
                label="Foto"
                value={formData.photo}
                onChange={(value) => setFormData({ ...formData, photo: value })}
                folder="coaches"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">Licencia</Label>
                <Input
                  id="license"
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  placeholder="ej: UEFA B, CONMEBOL Pro"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Años de experiencia *</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: Number.parseInt(e.target.value) || 0 })}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="specialty">Especialidad</Label>
                <Select
                  value={formData.specialty || "__none__"}
                  onValueChange={(value) => setFormData({ ...formData, specialty: value === "__none__" ? "" : value })}
                >
                  <SelectTrigger id="specialty" disabled={isSaving}>
                    <SelectValue placeholder="Selecciona una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin especialidad</SelectItem>
                    {COACH_SPECIALTIES.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSaving}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="coach-team">Equipo (opcional)</Label>
                <Input
                  id="coach-team"
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  placeholder="Buscar y seleccionar equipo..."
                  disabled={isSaving}
                />
                <div className="max-h-44 overflow-y-auto rounded-md border">
                  <button
                    type="button"
                    className="w-full border-b px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setFormData({ ...formData, teamId: "" })
                      setTeamSearch("")
                    }}
                    disabled={isSaving}
                  >
                    Sin equipo asignado
                  </button>
                  {filteredTeams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setFormData({ ...formData, teamId: team.id })
                        setTeamSearch(team.name)
                      }}
                      disabled={isSaving}
                    >
                      {team.name}
                    </button>
                  ))}
                  {filteredTeams.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No se encontraron equipos</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Seleccionado: {selectedTeamName || "Sin equipo asignado"}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
