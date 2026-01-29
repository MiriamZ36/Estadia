"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Player } from "./team-builder"
import { User, Hash, Save } from "lucide-react"
import { FileUploadInput } from "@/components/file-upload-input"

interface PlayerCardProps {
  player: Player
  onUpdate: (player: Player) => void
  onPhotoUpload: (playerId: string, photoUrl: string) => void
}

export default function PlayerCard({ player, onUpdate, onPhotoUpload }: PlayerCardProps) {
  const [editedPlayer, setEditedPlayer] = useState(player)

  const handleSave = () => {
    onUpdate(editedPlayer)
  }

  const handlePhotoChange = (base64: string) => {
    setEditedPlayer({ ...editedPlayer, photo: base64 })
    onPhotoUpload(player.id, base64)
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Editar Jugador
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">Actualiza la información del jugador</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Avatar actual */}
        <div className="flex justify-center">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={editedPlayer.photo || "/placeholder.svg"} alt={editedPlayer.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold">
              {editedPlayer.number}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="player-name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nombre
          </Label>
          <Input
            id="player-name"
            value={editedPlayer.name}
            onChange={(e) => setEditedPlayer({ ...editedPlayer, name: e.target.value })}
            placeholder="Nombre del jugador"
          />
        </div>

        {/* Número */}
        <div className="space-y-2">
          <Label htmlFor="player-number" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Número
          </Label>
          <Input
            id="player-number"
            type="number"
            min="1"
            max="99"
            value={editedPlayer.number}
            onChange={(e) => setEditedPlayer({ ...editedPlayer, number: Number.parseInt(e.target.value) || 0 })}
            placeholder="Número de camiseta"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="player-photo">Foto del Jugador</Label>
          <FileUploadInput
            id="player-photo"
            currentFile={editedPlayer.photo}
            onFileChange={handlePhotoChange}
            accept="image/*"
          />
        </div>

        {/* Botón guardar */}
        <Button onClick={handleSave} className="w-full" size="lg">
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </CardContent>
    </Card>
  )
}
