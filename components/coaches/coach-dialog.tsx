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
import { saveCoach } from "@/lib/storage"
import type { Coach } from "@/lib/types"
import { FileUploadInput } from "@/components/file-upload-input"

interface CoachDialogProps {
  open: boolean
  onClose: () => void
  coach: Coach | null
}

export function CoachDialog({ open, onClose, coach }: CoachDialogProps) {
  const [formData, setFormData] = useState<Partial<Coach>>({
    name: "",
    license: "",
    experience: 0,
    email: "",
    phone: "",
    photo: "",
    specialty: "",
  })

  useEffect(() => {
    if (coach) {
      setFormData(coach)
    } else {
      setFormData({
        name: "",
        license: "",
        experience: 0,
        email: "",
        phone: "",
        photo: "",
        specialty: "",
      })
    }
  }, [coach, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newCoach: Coach = {
      id: coach?.id || `coach_${Date.now()}`,
      name: formData.name!,
      license: formData.license,
      experience: formData.experience!,
      email: formData.email!,
      phone: formData.phone,
      photo: formData.photo,
      specialty: formData.specialty,
    }
    saveCoach(newCoach)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coach ? "Editar Entrenador" : "Nuevo Entrenador"}</DialogTitle>
          <DialogDescription>Complete la información del entrenador</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <FileUploadInput
              label="Foto"
              value={formData.photo}
              onChange={(value) => setFormData({ ...formData, photo: value })}
            />
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="ej: Fútbol Ofensivo, Táctica Defensiva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
