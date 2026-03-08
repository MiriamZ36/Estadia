"use client"

import { useEffect, useState } from "react"
import { Mail, Shield, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { FileUploadInput } from "@/components/file-upload-input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function UserProfile() {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    photo: user?.photo || "",
  })

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      photo: user?.photo || "",
    })
  }, [user])

  const handleSave = async () => {
    const result = await updateProfile(formData)

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "No fue posible actualizar el perfil",
        description: result.error,
      })
      return
    }

    setIsEditing(false)
    toast({
      title: "Perfil actualizado",
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
                <AvatarImage src={formData.photo || "/placeholder.svg"} alt={formData.name} />
                <AvatarFallback className="text-2xl">
                  {formData.name
                    .split(" ")
                    .filter(Boolean)
                    .map((name) => name[0])
                    .join("") || "FP"}
                </AvatarFallback>
              </Avatar>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label>Foto de perfil</Label>
                <FileUploadInput
                  value={formData.photo}
                  onChange={(value) => setFormData({ ...formData, photo: value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  Guardar cambios
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: user?.name || "",
                      email: user?.email || "",
                      photo: user?.photo || "",
                    })
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="w-full">
                Editar perfil
              </Button>
            )}
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
                <p className="text-sm text-muted-foreground">{user?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Correo electronico</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Rol</p>
                <p className="text-sm text-muted-foreground">{getRoleLabel(user?.role || "")}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Miembro desde{" "}
                {new Date(user?.createdAt || "").toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
