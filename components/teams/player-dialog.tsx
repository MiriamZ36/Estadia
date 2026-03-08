"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { Player, Team } from "@/lib/types"
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
  teamId?: string
  teams: Team[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (player: Player) => Promise<void>
  isSaving?: boolean
}

export function PlayerDialog({ player, teamId, teams, open, onOpenChange, onSave, isSaving = false }: PlayerDialogProps) {
  const [formData, setFormData] = useState<Partial<Player>>({
    name: "",
    position: "Delantero",
    number: 1,
    photo: "",
    nationality: "Mexico",
    dominantFoot: "right",
    teamId: teamId || "",
  })

  useEffect(() => {
    if (player) {
      setFormData(player)
      return
    }

    setFormData({
      name: "",
      position: "Delantero",
      number: 1,
      photo: "",
      nationality: "Mexico",
      dominantFoot: "right",
      teamId: teamId || "",
    })
  }, [player, teamId, open])

  const selectedTeamId = formData.teamId || teamId || ""
  const isTeamLocked = Boolean(teamId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const resolvedTeamId = selectedTeamId

    if (!resolvedTeamId) {
      return
    }

    const playerData: Player = {
      id: player?.id || "",
      name: formData.name || "",
      teamId: resolvedTeamId,
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

    await onSave(playerData)
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{player ? "Editar Jugador" : "Agregar Nuevo Jugador"}</DialogTitle>
          <DialogDescription>
            {player ? "Modifica los datos del jugador" : "Ingresa la informacion del nuevo jugador"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basico</TabsTrigger>
              <TabsTrigger value="physical">Fisico</TabsTrigger>
              <TabsTrigger value="contact">Contacto</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-4 space-y-4">
              {!isTeamLocked && (
                <div className="space-y-2">
                  <Label htmlFor="team">Equipo</Label>
                  <Select value={selectedTeamId} onValueChange={(value) => setFormData({ ...formData, teamId: value })}>
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Selecciona un equipo" />
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
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Juan Perez"
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Posicion</Label>
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
                  <Label htmlFor="number">Numero</Label>
                  <Input
                    id="number"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: Number.parseInt(e.target.value) || 1 })}
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate || ""}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nacionalidad</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality || ""}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="Mexico"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FileUploadInput
                  label="Foto del jugador"
                  value={formData.photo}
                  onChange={(value) => setFormData({ ...formData, photo: value })}
                  accept="image/*"
                />
              </div>
            </TabsContent>

            <TabsContent value="physical" className="mt-4 space-y-4">
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
                    disabled={isSaving}
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
                    disabled={isSaving}
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
                  value={formData.bloodType || ""}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  placeholder="O+"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalNotes">Notas Medicas</Label>
                <Textarea
                  id="medicalNotes"
                  value={formData.medicalNotes || ""}
                  onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                  placeholder="Alergias, condiciones medicas, etc."
                  rows={3}
                  disabled={isSaving}
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electronico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jugador@email.com"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+52 123 456 7890"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
                <Textarea
                  id="emergencyContact"
                  value={formData.emergencyContact || ""}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Nombre y telefono del contacto de emergencia"
                  rows={3}
                  disabled={isSaving}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || (!isTeamLocked && !selectedTeamId)}>
              {isSaving ? "Guardando..." : player ? "Guardar Cambios" : "Crear Jugador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
