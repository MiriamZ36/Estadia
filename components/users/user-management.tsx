"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
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
import { UserPlus, Trash2, AlertTriangle } from "lucide-react"
import type { User } from "@/lib/types"
import { clearDataExceptUsers } from "@/lib/storage"

export function UserManagement() {
  const { user: currentUser, register } = useAuth()
  const [users, setUsers] = useState<(User & { password?: string })[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "fan" as User["role"],
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    const storedUsers = JSON.parse(localStorage.getItem("ligasmart_users") || "[]")
    setUsers(storedUsers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const success = await register(formData.name, formData.email, formData.password, formData.role)

    if (success) {
      setIsDialogOpen(false)
      setFormData({ name: "", email: "", password: "", role: "fan" })
      loadUsers()
    } else {
      alert("El correo electrónico ya está en uso")
    }
  }

  const handleDelete = (userId: string) => {
    if (userId === currentUser?.id) {
      alert("No puedes eliminar tu propia cuenta")
      return
    }

    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      const updatedUsers = users.filter((u) => u.id !== userId)
      localStorage.setItem("ligasmart_users", JSON.stringify(updatedUsers))
      loadUsers()
    }
  }

  const handleClearData = () => {
    clearDataExceptUsers()
    setIsClearDialogOpen(false)
    alert("Todos los datos (excepto usuarios) han sido eliminados exitosamente")
    window.location.reload()
  }

  const getRoleBadge = (role: User["role"]) => {
    const roleConfig = {
      admin: { label: "Administrador", variant: "default" as const },
      referee: { label: "Árbitro", variant: "secondary" as const },
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
          <CardDescription>Solo los administradores pueden acceder a esta sección</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">Administra los usuarios del sistema</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Limpiar Datos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Eliminación de Datos</DialogTitle>
                <DialogDescription>
                  Esta acción eliminará todos los torneos, equipos, jugadores, partidos, árbitros y entrenadores del
                  sistema. Los usuarios no serán afectados. Esta acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleClearData} className="flex-1">
                  Confirmar Eliminación
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
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>Completa los datos del nuevo usuario del sistema</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
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
                      <SelectItem value="referee">Árbitro</SelectItem>
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
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>Total de usuarios: {users.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha de Registro</TableHead>
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
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
