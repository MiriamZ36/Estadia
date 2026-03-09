"use client"

import { useEffect, useState } from "react"
import { Mail, Shield, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { FileUploadInput } from "@/components/file-upload-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { User as AppUser } from "@/lib/types"

export function UserProfile() {
  const { user, updateProfile, changePassword } = useAuth()
  const { toast } = useToast()
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isChangingPhoto, setIsChangingPhoto] = useState(false)
  const [profileUser, setProfileUser] = useState<AppUser | null>(null)
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const currentUser = profileUser || user
  const [photoDraft, setPhotoDraft] = useState("")

  useEffect(() => {
    setPhotoDraft(currentUser?.photo || "")
  }, [currentUser?.photo])

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoadingProfile(true)
      const response = await fetch("/api/profile", { cache: "no-store" })
      const result = await response.json()
      setIsLoadingProfile(false)

      if (!response.ok) {
        return
      }

      setProfileUser(result.user || null)
    }

    void loadProfile()
  }, [])

  const handleSavePhoto = async () => {
    if (!currentUser) return
    setIsChangingPhoto(true)
    const result = await updateProfile({
      name: currentUser.name,
      email: currentUser.email,
      photo: photoDraft,
    })
    setIsChangingPhoto(false)

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "No fue posible actualizar la foto",
        description: result.error,
      })
      return
    }

    const response = await fetch("/api/profile", { cache: "no-store" })
    const refreshed = await response.json()
    if (response.ok) {
      setProfileUser(refreshed.user || null)
    }
    setIsPhotoModalOpen(false)
    toast({
      title: "Foto actualizada",
      description: "La foto de perfil se actualizo correctamente.",
    })
  }

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Faltan campos",
        description: "Captura y confirma la nueva contrasena.",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Contrasenas no coinciden",
        description: "Verifica que ambas contrasenas sean iguales.",
      })
      return
    }

    setIsChangingPassword(true)
    const result = await changePassword(passwordData.newPassword)
    setIsChangingPassword(false)

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "No fue posible cambiar la contrasena",
        description: result.error,
      })
      return
    }

    setPasswordData({
      newPassword: "",
      confirmPassword: "",
    })
    setIsPasswordModalOpen(false)
    toast({
      title: "Contrasena actualizada",
      description: result.message,
    })
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador"
      case "referee":
        return "Arbitro"
      case "coach":
        return "Entrenador"
      default:
        return "Aficionado"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
        <p className="text-muted-foreground">Gestiona tu informacion personal</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacion personal</CardTitle>
            <CardDescription>Actualiza tus datos de perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-4 flex justify-center">
                <Avatar className="h-24 w-24">
                <AvatarImage src={currentUser?.photo || "/placeholder.svg"} alt={currentUser?.name} />
                <AvatarFallback className="text-2xl">
                  {(currentUser?.name || "")
                    .split(" ")
                    .filter(Boolean)
                    .map((name) => name[0])
                    .join("") || "FP"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={currentUser?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Correo electronico</Label>
              <Input value={currentUser?.email || ""} disabled />
            </div>
            <Button onClick={() => setIsPhotoModalOpen(true)} className="w-full">
              Cambiar foto
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informacion de cuenta</CardTitle>
            <CardDescription>Detalles de tu acceso actual en FutPro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Nombre de usuario</p>
                <p className="text-sm text-muted-foreground">{currentUser?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Correo electronico</p>
                <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Rol</p>
                <p className="text-sm text-muted-foreground">{getRoleLabel(currentUser?.role || "")}</p>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setIsPasswordModalOpen(true)}>
              Cambiar contrasena
            </Button>

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Miembro desde{" "}
                {new Date(currentUser?.createdAt || "").toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {isLoadingProfile && <p className="mt-2 text-xs text-muted-foreground">Sincronizando datos de perfil...</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar contrasena</DialogTitle>
            <DialogDescription>Ingresa una nueva contrasena para tu cuenta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contrasena</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(event) => setPasswordData((previous) => ({ ...previous, newPassword: event.target.value }))}
                placeholder="Minimo 6 caracteres"
                disabled={isChangingPassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(event) => setPasswordData((previous) => ({ ...previous, confirmPassword: event.target.value }))}
                placeholder="Repite la nueva contrasena"
                disabled={isChangingPassword}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)} disabled={isChangingPassword}>
              Cancelar
            </Button>
            <Button onClick={() => void handleChangePassword()} disabled={isChangingPassword}>
              {isChangingPassword ? "Actualizando..." : "Actualizar contrasena"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar foto de perfil</DialogTitle>
            <DialogDescription>Sube una nueva imagen para tu perfil.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <FileUploadInput label="Foto de perfil" value={photoDraft} onChange={setPhotoDraft} folder="profiles" />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPhotoDraft(currentUser?.photo || "")
                setIsPhotoModalOpen(false)
              }}
              disabled={isChangingPhoto}
            >
              Cancelar
            </Button>
            <Button onClick={() => void handleSavePhoto()} disabled={isChangingPhoto}>
              {isChangingPhoto ? "Actualizando..." : "Actualizar foto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
