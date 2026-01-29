"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Castle as Whistle } from "lucide-react"
import { getReferees, deleteReferee } from "@/lib/storage"
import { useAuth } from "@/lib/auth-context"
import type { Referee } from "@/lib/types"
import { RefereeDialog } from "./referee-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function RefereeList() {
  const { user } = useAuth()
  const [referees, setReferees] = useState<Referee[]>([])
  const [selectedReferee, setSelectedReferee] = useState<Referee | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadReferees()
  }, [])

  const loadReferees = () => {
    setReferees(getReferees())
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este árbitro?")) {
      deleteReferee(id)
      loadReferees()
    }
  }

  const handleEdit = (referee: Referee) => {
    setSelectedReferee(referee)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedReferee(null)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setSelectedReferee(null)
    loadReferees()
  }

  const canManage = user?.role === "admin"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Whistle className="h-5 w-5" />
                Árbitros
              </CardTitle>
              <CardDescription>Gestión de árbitros del sistema</CardDescription>
            </div>
            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Árbitro
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {referees.map((referee) => (
              <Card key={referee.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={referee.photo || "/placeholder.svg"} alt={referee.name} />
                      <AvatarFallback>
                        <Whistle className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{referee.name}</h3>
                      <p className="text-sm text-muted-foreground">{referee.license}</p>
                      <Badge variant="secondary" className="mt-1">
                        {referee.experience} años
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 text-sm space-y-1">
                    <p className="text-muted-foreground">{referee.email}</p>
                    {referee.phone && <p className="text-muted-foreground">{referee.phone}</p>}
                  </div>
                  {canManage && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(referee)} className="flex-1">
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(referee.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {referees.length === 0 && (
            <div className="text-center py-12">
              <Whistle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay árbitros registrados</h3>
              <p className="text-muted-foreground">Comienza agregando un nuevo árbitro</p>
            </div>
          )}
        </CardContent>
      </Card>

      <RefereeDialog open={isDialogOpen} onClose={handleDialogClose} referee={selectedReferee} />
    </div>
  )
}
