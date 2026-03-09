"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AlertTriangle, Pencil, Trash2, UserPlus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ProgressDialog } from "@/components/ui/progress-dialog"
import type { User } from "@/lib/types"
import { clearDataExceptUsers } from "@/lib/storage"

type ProgressState = {
  open: boolean
  title: string
  description: string
}

const idleProgress: ProgressState = {
  open: false,
  title: "",
  description: "",
}

export function UserManagement() {
  const { user: currentUser, register } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "fan" as User["role"],
  })
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "fan" as User["role"],
  })
  const [progressState, setProgressState] = useState<ProgressState>(idleProgress)

  useEffect(() => {
    void loadUsers(true)
  }, [])

  const openProgress = (title: string, description: string) => {
    setProgressState({
      open: true,
      title,
      description,
    })
  }

  const closeProgress = () => {
    setProgressState(idleProgress)
  }

  const loadUsers = async (showProgress = false) => {
    if (showProgress) {
      openProgress("Cargando usuarios", "Consultando usuarios y perfiles en la base de datos.")
    }

    const response = await fetch("/api/admin/users", {
      cache: "no-store",
    })

    const result = await response.json()

    if (showProgress) {
      closeProgress()
    }

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible cargar usuarios",
        description: result.error || "La lista de usuarios no pudo recuperarse.",
      })
      return
    }

    setUsers(result.users || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await register(formData.name, formData.email, formData.password, formData.role)

    if (!result.success) {
      toast({
        variant: "destructive",
        title: "No fue posible crear el usuario",
        description: result.error,
      })
      return
    }

    setIsDialogOpen(false)
    setFormData({ name: "", email: "", password: "", role: "fan" })
    await loadUsers()

    toast({
      title: "Usuario creado",
      description: result.message,
    })
  }

  const handleDelete = async () => {
    if (!userToDelete) return

    const response = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: userToDelete.id }),
    })

    const result = await response.json()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible eliminar el usuario",
        description: result.error,
      })
      return
    }

    setUserToDelete(null)
    await loadUsers()

    toast({
      title: "Usuario eliminado",
      description: "La cuenta fue eliminada correctamente.",
    })
  }

  const openEditDialog = (targetUser: User) => {
    setUserToEdit(targetUser)
    setEditFormData({
      name: targetUser.name,
      email: targetUser.email,
      password: "",
      role: targetUser.role,
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToEdit) return

    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: userToEdit.id,
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
        password: editFormData.password || undefined,
      }),
    })

    const result = await response.json()
    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible actualizar el usuario",
        description: result.error || "Intenta nuevamente.",
      })
      return
    }

    setIsEditDialogOpen(false)
    setUserToEdit(null)
    setEditFormData({
      name: "",
      email: "",
      password: "",
      role: "fan",
    })
    await loadUsers()

    toast({
      title: "Usuario actualizado",
      description: "La cuenta fue actualizada correctamente.",
    })
  }

  const handleClearData = () => {
    clearDataExceptUsers()
    setIsClearDialogOpen(false)
    toast({
      title: "Datos reiniciados",
      description: "Se eliminaron los datos operativos y se conservaron los usuarios.",
    })
    window.location.reload()
  }

  const getRoleBadge = (role: User["role"]) => {
    const roleConfig = {
      admin: { label: "Administrador", variant: "default" as const },
      referee: { label: "Arbitro", variant: "secondary" as const },
      coach: { label: "Entrenador", variant: "outline" as const },
      fan: { label: "Aficionado", variant: "outline" as const },
    }

    return roleConfig[role]
  }

  if (currentUser?.role !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso Denegado</CardTitle>
          <CardDescription>Solo los administradores pueden acceder a esta seccion</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestion de Usuarios</h2>
          <p className="text-muted-foreground">Administra los usuarios reales del sistema</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Limpiar Datos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar eliminacion de datos</DialogTitle>
                <DialogDescription>
                  Esta accion elimina datos operativos locales del prototipo. Las cuentas y perfiles permanecen.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleClearData} className="flex-1">
                  Confirmar eliminacion
                </Button>
                <Button variant="outline" onClick={() => setIsClearDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear nuevo usuario</DialogTitle>
                <DialogDescription>Completa los datos del nuevo acceso del sistema.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electronico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contrasena</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: User["role"]) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="referee">Arbitro</SelectItem>
                      <SelectItem value="coach">Entrenador</SelectItem>
                      <SelectItem value="fan">Aficionado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Crear Usuario
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios registrados</CardTitle>
          <CardDescription>Total de usuarios: {users.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha de registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const roleBadge = getRoleBadge(user.role)

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString("es-MX")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToDelete(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(userToDelete)} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              {userToDelete
                ? `Se eliminara la cuenta de ${userToDelete.name}. Esta accion no se puede deshacer.`
                : "Confirma la eliminacion del usuario."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={handleDelete} className="flex-1">
              Eliminar usuario
            </Button>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) {
            setUserToEdit(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>Actualiza nombre, correo, rol y contrasena opcional.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre completo</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Correo electronico</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva contrasena (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                minLength={6}
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                placeholder="Deja vacio para conservar la actual"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value: User["role"]) => setEditFormData({ ...editFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="referee">Arbitro</SelectItem>
                  <SelectItem value="coach">Entrenador</SelectItem>
                  <SelectItem value="fan">Aficionado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Guardar cambios
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setUserToEdit(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ProgressDialog open={progressState.open} title={progressState.title} description={progressState.description} />
    </div>
  )
}
