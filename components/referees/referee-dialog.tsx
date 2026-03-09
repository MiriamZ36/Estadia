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
import type { Referee } from "@/lib/types"
import { FileUploadInput } from "@/components/file-upload-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface RefereeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  referee: Referee | null
  onSave: (referee: Referee) => Promise<void>
  isSaving?: boolean
}

export function RefereeDialog({ open, onOpenChange, referee, onSave, isSaving = false }: RefereeDialogProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Referee = {
      id: referee?.id || "",
      name: formData.name!,
      license: formData.license!,
      experience: formData.experience!,
      email: formData.email!,
      phone: formData.phone,
      photo: formData.photo,
    }
    await onSave(payload)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] w-[95vw] !max-w-[1100px] overflow-x-hidden overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{referee ? "Editar Árbitro" : "Nuevo Árbitro"}</DialogTitle>
          <DialogDescription>Complete la información del árbitro</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4 lg:grid-cols-[300px_1fr]">
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-3 text-sm font-medium">Vista previa</p>
                <Avatar className="mx-auto h-40 w-40 border">
                  <AvatarImage src={formData.photo || "/placeholder.svg"} alt={formData.name || "Arbitro"} />
                  <AvatarFallback>AR</AvatarFallback>
                </Avatar>
              </div>
              <FileUploadInput
                label="Foto"
                value={formData.photo}
                onChange={(value) => setFormData({ ...formData, photo: value })}
                folder="referees"
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
                <Label htmlFor="license">Licencia *</Label>
                <Input
                  id="license"
                  value={formData.license}
                  onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                  disabled={isSaving}
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
                  disabled={isSaving}
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
