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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Tournament } from "@/lib/types"

interface TeamDialogProps {
  team: Team | null
  tournamentId: string
  tournaments: Tournament[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (team: Team) => Promise<void>
  isSaving?: boolean
}

function getFileExtension(filename: string) {
  const segments = filename.split(".")
  return segments.length > 1 ? segments.pop() : "jpg"
}

export function TeamDialog({
  team,
  tournamentId,
  tournaments,
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}: TeamDialogProps) {
  const { toast } = useToast()
  const supabase = createSupabaseBrowserClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("")
  const [formData, setFormData] = useState<Partial<Team>>({
    name: "",
    logo: "",
    tournamentId: "",
  })

  useEffect(() => {
    if (team) {
      setFormData(team)
    } else {
      setFormData({
        name: "",
        logo: "",
        tournamentId: tournamentId || "",
      })
    }

    setSelectedLogoFile(null)
    setLogoPreviewUrl("")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [team, open, tournamentId])

  useEffect(() => {
    return () => {
      if (logoPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreviewUrl)
      }
    }
  }, [logoPreviewUrl])

  const uploadSelectedLogo = async () => {
    if (!selectedLogoFile) {
      return formData.logo || ""
    }

    setIsUploading(true)
    const extension = getFileExtension(selectedLogoFile.name)
    const path = `equipos/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

    const { error } = await supabase.storage.from("fotos").upload(path, selectedLogoFile, {
      upsert: false,
      contentType: selectedLogoFile.type,
    })

    if (error) {
      throw new Error(error.message)
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("fotos").getPublicUrl(path)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const logoUrl = await uploadSelectedLogo()

      const teamData: Team = {
        id: team?.id || "",
        name: formData.name || "",
        tournamentId: formData.tournamentId || "",
        logo: logoUrl || undefined,
        foundedDate: team?.foundedDate || new Date().toISOString().slice(0, 10),
      }

      await onSave(teamData)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible procesar el logo del equipo."
      toast({
        variant: "destructive",
        title: "Error al subir imagen",
        description: `${message} Verifica permisos del bucket fotos y politicas de Storage.`,
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    if (logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreviewUrl)
    }

    const previewUrl = URL.createObjectURL(file)
    setSelectedLogoFile(file)
    setLogoPreviewUrl(previewUrl)
    setFormData((previous) => ({
      ...previous,
      logo: previous.logo || "",
    }))

    toast({
      title: "Vista previa lista",
      description: "El logo se subira al guardar el equipo.",
    })
  }

  const handleRemoveLogo = () => {
    if (logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreviewUrl)
    }

    setSelectedLogoFile(null)
    setLogoPreviewUrl("")
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
              <Label htmlFor="team-tournament">Torneo (opcional)</Label>
              <Select
                value={formData.tournamentId || "__none__"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    tournamentId: value === "__none__" ? "" : value,
                  })
                }
              >
                <SelectTrigger id="team-tournament" disabled={isSaving || isUploading}>
                  <SelectValue placeholder="Sin torneo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin torneo</SelectItem>
                  {tournaments.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Logo del equipo</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={logoPreviewUrl || formData.logo || "/placeholder.svg"} alt={formData.name || "Equipo"} />
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
                    onChange={handleUploadLogo}
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
                      {isUploading ? "Subiendo..." : selectedLogoFile || formData.logo ? "Cambiar logo" : "Seleccionar logo"}
                    </Button>
                    {(selectedLogoFile || formData.logo) && (
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
                  {selectedLogoFile && <p className="mt-2 text-xs text-muted-foreground">Vista previa: {selectedLogoFile.name}</p>}
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
