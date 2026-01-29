"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, ClipboardList } from "lucide-react"
import { getCoaches, deleteCoach } from "@/lib/storage"
import { useAuth } from "@/lib/auth-context"
import type { Coach } from "@/lib/types"
import { CoachDialog } from "./coach-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function CoachList() {
  const { user } = useAuth()
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadCoaches()
  }, [])

  const loadCoaches = () => {
    setCoaches(getCoaches())
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este entrenador?")) {
      deleteCoach(id)
      loadCoaches()
    }
  }

  const handleEdit = (coach: Coach) => {
    setSelectedCoach(coach)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedCoach(null)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedCoach(null)
    loadCoaches()
  }

  const canManage = user?.role === "admin"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Entrenadores
              </CardTitle>
              <CardDescription>Gestión de directores técnicos</CardDescription>
            </div>
            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Entrenador
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach) => (
              <Card key={coach.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={coach.photo || "/placeholder.svg"} alt={coach.name} />
                      <AvatarFallback>
                        <ClipboardList className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{coach.name}</h3>
                      {coach.license && <p className="text-sm text-muted-foreground">{coach.license}</p>}
                      <Badge variant="secondary" className="mt-1">
                        {coach.experience} años
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 text-sm space-y-1">
                    {coach.specialty && <p className="font-medium text-green-600">{coach.specialty}</p>}
                    <p className="text-muted-foreground">{coach.email}</p>
                    {coach.phone && <p className="text-muted-foreground">{coach.phone}</p>}
                  </div>
                  {canManage && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(coach)} className="flex-1">
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(coach.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {coaches.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay entrenadores registrados</h3>
              <p className="text-muted-foreground">Comienza agregando un nuevo entrenador</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CoachDialog open={isDialogOpen} onClose={handleDialogClose} coach={selectedCoach} />
    </div>
  )
}
