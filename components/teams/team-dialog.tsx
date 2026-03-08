"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, Upload, X } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { Team } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

interface TeamDialogProps {
  team: Team | null
  tournamentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (team: Team) => Promise<void>
  isSaving?: boolean
}

function getFileExtension(filename: string) {
  const segments = filename.split(".")
  return segments.length > 1 ? segments.pop() : "jpg"
}

export function TeamDialog({ team, tournamentId, open, onOpenChange, onSave, isSaving = false }: TeamDialogProps) {
  const { toast } = useToast()
  const supabase = createSupabaseBrowserClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<Partial<Team>>({
    name: "",
    logo: "",
  })

  useEffect(() => {
    if (team) {
      setFormData(team)
      return
    }

    setFormData({
      name: "",
      logo: "",
    })
  }, [team, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const teamData: Team = {
      id: team?.id || "",
      name: formData.name || "",
      tournamentId: team?.tournamentId || tournamentId,
      logo: formData.logo,
      foundedDate: team?.foundedDate || new Date().toISOString().slice(0, 10),
    }

    await onSave(teamData)
  }

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Archivo no valido",
        description: "Debes seleccionar una imagen para el logo del equipo.",
      })
      return
    }

    setIsUploading(true)
    const extension = getFileExtension(file.name)
    const path = `equipos/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

    const { error } = await supabase.storage.from("fotos").upload(path, file, {
      upsert: false,
      contentType: file.type,
    })

    if (error) {
      setIsUploading(false)
      toast({
        variant: "destructive",
        title: "Error al subir imagen",
        description: error.message,
      })
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("fotos").getPublicUrl(path)

    setFormData((previous) => ({
      ...previous,
      logo: publicUrl,
    }))
    setIsUploading(false)

    toast({
      title: "Logo cargado",
      description: "La imagen se subio correctamente al bucket fotos.",
    })
  }

  const handleRemoveLogo = () => {
    setFormData((previous) => ({
      ...previous,
      logo: "",
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && !isUploading && onOpenChange(nextOpen)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{team ? "Editar Equipo" : "Crear Nuevo Equipo"}</DialogTitle>
          <DialogDescription>
            {team ? "Modifica los datos del equipo" : "Ingresa la informacion del nuevo equipo"}
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
                placeholder="Aguilas FC"
                required
                disabled={isSaving || isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label>Logo del equipo</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={formData.logo || "/placeholder.svg"} alt={formData.name || "Equipo"} />
                  <AvatarFallback>
                    <ImagePlus className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => void handleUploadLogo(event)}
                    disabled={isSaving || isUploading}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={isSaving || isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {isUploading ? "Subiendo..." : formData.logo ? "Cambiar logo" : "Subir logo"}
                    </Button>
                    {formData.logo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isSaving || isUploading}
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving || isUploading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || isUploading}>
              {isSaving ? "Guardando..." : team ? "Guardar Cambios" : "Crear Equipo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
