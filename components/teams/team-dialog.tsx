"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Team } from "@/lib/types"
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
import { FileUploadInput } from "@/components/file-upload-input"

interface TeamDialogProps {
  team: Team | null
  tournamentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (team: Team) => void
}

export function TeamDialog({ team, tournamentId, open, onOpenChange, onSave }: TeamDialogProps) {
  const [formData, setFormData] = useState<Partial<Team>>({
    name: "",
    logo: "",
  })

  useEffect(() => {
    if (team) {
      setFormData(team)
    } else {
      setFormData({
        name: "",
        logo: "",
      })
    }
  }, [team])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const teamData: Team = {
      id: team?.id || Date.now().toString(),
      name: formData.name || "",
      tournamentId: team?.tournamentId || tournamentId,
      logo: formData.logo,
      foundedDate: team?.foundedDate || new Date().toISOString(),
    }

    onSave(teamData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{team ? "Editar Equipo" : "Crear Nuevo Equipo"}</DialogTitle>
          <DialogDescription>
            {team ? "Modifica los datos del equipo" : "Ingresa la información del nuevo equipo"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Equipo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Águilas FC"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo del Equipo</Label>
              <FileUploadInput
                id="logo"
                value={formData.logo}
                onChange={(value) => setFormData({ ...formData, logo: value })}
                accept="image/*"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{team ? "Guardar Cambios" : "Crear Equipo"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
