"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Player } from "@/lib/types"
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
import { FileUploadInput } from "@/components/file-upload-input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PlayerDialogProps {
  player: Player | null
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (player: Player) => void
}

export function PlayerDialog({ player, teamId, open, onOpenChange, onSave }: PlayerDialogProps) {
  const [formData, setFormData] = useState<Partial<Player>>({
    name: "",
    position: "Delantero",
    number: 1,
    photo: "",
    nationality: "México",
    dominantFoot: "right",
  })

  useEffect(() => {
    if (player) {
      setFormData(player)
    } else {
      setFormData({
        name: "",
        position: "Delantero",
        number: 1,
        photo: "",
        nationality: "México",
        dominantFoot: "right",
      })
    }
  }, [player])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const playerData: Player = {
      id: player?.id || Date.now().toString(),
      name: formData.name || "",
      teamId: player?.teamId || teamId,
      position: formData.position || "Delantero",
      number: formData.number || 1,
      photo: formData.photo,
      birthDate: formData.birthDate,
      nationality: formData.nationality,
      height: formData.height,
      weight: formData.weight,
      dominantFoot: formData.dominantFoot,
      email: formData.email,
      phone: formData.phone,
      emergencyContact: formData.emergencyContact,
      bloodType: formData.bloodType,
      medicalNotes: formData.medicalNotes,
    }

    onSave(playerData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{player ? "Editar Jugador" : "Agregar Nuevo Jugador"}</DialogTitle>
          <DialogDescription>
            {player ? "Modifica los datos del jugador" : "Ingresa la información del nuevo jugador"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="physical">Físico</TabsTrigger>
              <TabsTrigger value="contact">Contacto</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Posición</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Portero">Portero</SelectItem>
                      <SelectItem value="Defensa">Defensa</SelectItem>
                      <SelectItem value="Medio">Medio</SelectItem>
                      <SelectItem value="Delantero">Delantero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: Number.parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nacionalidad</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="México"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Foto del Jugador</Label>
                <FileUploadInput
                  id="photo"
                  value={formData.photo}
                  onChange={(value) => setFormData({ ...formData, photo: value })}
                  accept="image/*"
                />
              </div>
            </TabsContent>

            <TabsContent value="physical" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="100"
                    max="250"
                    value={formData.height || ""}
                    onChange={(e) => setFormData({ ...formData, height: Number.parseInt(e.target.value) || undefined })}
                    placeholder="175"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="40"
                    max="150"
                    value={formData.weight || ""}
                    onChange={(e) => setFormData({ ...formData, weight: Number.parseInt(e.target.value) || undefined })}
                    placeholder="70"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dominantFoot">Pie Dominante</Label>
                <Select
                  value={formData.dominantFoot}
                  onValueChange={(value: "left" | "right" | "both") =>
                    setFormData({ ...formData, dominantFoot: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Derecho</SelectItem>
                    <SelectItem value="left">Izquierdo</SelectItem>
                    <SelectItem value="both">Ambidiestro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">Tipo de Sangre</Label>
                <Input
                  id="bloodType"
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  placeholder="O+"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalNotes">Notas Médicas</Label>
                <Textarea
                  id="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  placeholder="Alergias, condiciones médicas, etc."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jugador@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+52 123 456 7890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
                <Textarea
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Nombre y teléfono del contacto de emergencia"
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{player ? "Guardar Cambios" : "Agregar Jugador"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
