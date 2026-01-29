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
import { saveReferee } from "@/lib/storage"
import type { Referee } from "@/lib/types"
import { FileUploadInput } from "@/components/file-upload-input"

interface RefereeDialogProps {
  open: boolean
  onClose: () => void
  referee: Referee | null
}

export function RefereeDialog({ open, onClose, referee }: RefereeDialogProps) {
  const [formData, setFormData] = useState<Partial<Referee>>({
    name: "",
    license: "",
    experience: 0,
    email: "",
    phone: "",
    photo: "",
  })

  useEffect(() => {
    if (referee) {
      setFormData(referee)
    } else {
      setFormData({
        name: "",
        license: "",
        experience: 0,
        email: "",
        phone: "",
        photo: "",
      })
    }
  }, [referee, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newReferee: Referee = {
      id: referee?.id || `ref_${Date.now()}`,
      name: formData.name!,
      license: formData.license!,
      experience: formData.experience!,
      email: formData.email!,
      phone: formData.phone,
      photo: formData.photo,
    }
    saveReferee(newReferee)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{referee ? "Editar Árbitro" : "Nuevo Árbitro"}</DialogTitle>
          <DialogDescription>Complete la información del árbitro</DialogDescription>
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
              <Label htmlFor="license">Licencia *</Label>
              <Input
                id="license"
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                required
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
