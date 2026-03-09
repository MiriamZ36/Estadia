"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Castle as Whistle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Referee } from "@/lib/types"
import { RefereeDialog } from "./referee-dialog"
import { ProgressDialog } from "@/components/ui/progress-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

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

export function RefereeList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [referees, setReferees] = useState<Referee[]>([])
  const [selectedReferee, setSelectedReferee] = useState<Referee | null>(null)
  const [refereeToDelete, setRefereeToDelete] = useState<Referee | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progressState, setProgressState] = useState<ProgressState>(idleProgress)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    void loadReferees(true)
  }, [])

  const openProgress = (title: string, description: string) => {
    setProgressState({ open: true, title, description })
  }

  const closeProgress = () => {
    setProgressState(idleProgress)
  }

  const loadReferees = async (showProgress = false) => {
    if (showProgress) {
      openProgress("Cargando arbitros", "Consultando arbitros registrados.")
    }

    const response = await fetch("/api/referees", {
      cache: "no-store",
    })
    const result = await response.json()

    if (showProgress) {
      closeProgress()
    }

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible cargar arbitros",
        description: result.error || "Verifica tu conexion y tu sesion actual.",
      })
      return
    }

    setReferees(result.referees || [])
  }

  const handleEdit = (referee: Referee) => {
    setSelectedReferee(referee)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedReferee(null)
    setIsDialogOpen(true)
  }

  const handleSave = async (referee: Referee) => {
    const isEditing = Boolean(referee.id)
    setIsSaving(true)
    openProgress(
      isEditing ? "Actualizando arbitro" : "Creando arbitro",
      isEditing ? "Guardando cambios del arbitro en la base de datos." : "Registrando nuevo arbitro en la base de datos.",
    )

    const response = await fetch(isEditing ? `/api/referees/${referee.id}` : "/api/referees", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(referee),
    })
    const result = await response.json()
    closeProgress()
    setIsSaving(false)

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible guardar el arbitro",
        description: result.error || "La operacion no pudo completarse.",
      })
      return
    }

    await loadReferees()
    setIsDialogOpen(false)
    setSelectedReferee(null)

    toast({
      title: isEditing ? "Arbitro actualizado" : "Arbitro creado",
      description: `${result.referee.name} fue ${isEditing ? "actualizado" : "registrado"} correctamente.`,
    })
  }

  const handleDelete = async () => {
    if (!refereeToDelete) return

    openProgress("Eliminando arbitro", "Estamos eliminando al arbitro seleccionado.")
    const response = await fetch(`/api/referees/${refereeToDelete.id}`, {
      method: "DELETE",
    })
    const result = await response.json()
    closeProgress()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible eliminar el arbitro",
        description: result.error || "La eliminacion no pudo completarse.",
      })
      return
    }

    const deletedRefereeName = refereeToDelete.name
    setRefereeToDelete(null)
    await loadReferees()

    toast({
      title: "Arbitro eliminado",
      description: `${deletedRefereeName} fue eliminado correctamente.`,
    })
  }

  const canManage = user?.role === "admin"
  const filteredReferees = referees.filter((referee) => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return true

    return (
      referee.name.toLowerCase().includes(normalizedSearch) ||
      referee.license.toLowerCase().includes(normalizedSearch) ||
      referee.email.toLowerCase().includes(normalizedSearch)
    )
  })

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
          <div className="mb-4">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, licencia o email"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReferees.map((referee) => (
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
                      <Button variant="destructive" size="sm" onClick={() => setRefereeToDelete(referee)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredReferees.length === 0 && (
            <div className="text-center py-12">
              <Whistle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No se encontraron árbitros</h3>
              <p className="text-muted-foreground">Ajusta la busqueda para ver resultados</p>
            </div>
          )}
        </CardContent>
      </Card>

      <RefereeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        referee={selectedReferee}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <Dialog open={Boolean(refereeToDelete)} onOpenChange={(open) => !open && setRefereeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar arbitro</DialogTitle>
            <DialogDescription>
              {refereeToDelete
                ? `Se eliminara ${refereeToDelete.name}. Esta accion no se puede deshacer.`
                : "Confirma la eliminacion del arbitro."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => void handleDelete()} className="flex-1">
              Eliminar
            </Button>
            <Button variant="outline" onClick={() => setRefereeToDelete(null)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProgressDialog open={progressState.open} title={progressState.title} description={progressState.description} />
    </div>
  )
}
