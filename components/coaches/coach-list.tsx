"use client"

import { useEffect, useState } from "react"
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Coach, Team } from "@/lib/types"
import { CoachDialog } from "./coach-dialog"
import { ProgressDialog } from "@/components/ui/progress-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export function CoachList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null)
  const [coachToDelete, setCoachToDelete] = useState<Coach | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progressState, setProgressState] = useState<ProgressState>(idleProgress)
  const [searchTerm, setSearchTerm] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [assignmentFilter, setAssignmentFilter] = useState("all")

  useEffect(() => {
    void loadData(true)
  }, [])

  const openProgress = (title: string, description: string) => {
    setProgressState({ open: true, title, description })
  }

  const closeProgress = () => {
    setProgressState(idleProgress)
  }

  const loadData = async (showProgress = false) => {
    if (showProgress) {
      openProgress("Cargando entrenadores", "Consultando entrenadores y equipos.")
    }

    const [coachesResponse, teamsResponse] = await Promise.all([
      fetch("/api/coaches", { cache: "no-store" }),
      fetch("/api/teams", { cache: "no-store" }),
    ])

    const coachesResult = await coachesResponse.json()
    const teamsResult = await teamsResponse.json()

    if (showProgress) {
      closeProgress()
    }

    if (!coachesResponse.ok || !teamsResponse.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible cargar entrenadores",
        description: coachesResult.error || teamsResult.error || "Verifica la conexion con Supabase.",
      })
      return
    }

    setCoaches(coachesResult.coaches || [])
    setTeams(teamsResult.teams || [])
  }

  const handleCreate = () => {
    setSelectedCoach(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (coach: Coach) => {
    setSelectedCoach(coach)
    setIsDialogOpen(true)
  }

  const handleSave = async (coach: Coach) => {
    const isEditing = Boolean(coach.id)
    setIsSaving(true)
    openProgress(
      isEditing ? "Actualizando entrenador" : "Creando entrenador",
      isEditing
        ? "Guardando cambios del entrenador y su equipo asignado."
        : "Registrando entrenador y aplicando enlace con equipo.",
    )

    const response = await fetch(isEditing ? `/api/coaches/${coach.id}` : "/api/coaches", {
      method: isEditing ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(coach),
    })
    const result = await response.json()
    closeProgress()
    setIsSaving(false)

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible guardar el entrenador",
        description: result.error || "La operacion no pudo completarse.",
      })
      return
    }

    await loadData()
    setIsDialogOpen(false)
    setSelectedCoach(null)

    toast({
      title: isEditing ? "Entrenador actualizado" : "Entrenador creado",
      description: `${result.coach.name} fue ${isEditing ? "actualizado" : "registrado"} correctamente.`,
    })
  }

  const handleDelete = async () => {
    if (!coachToDelete) return

    openProgress("Eliminando entrenador", "Estamos eliminando al entrenador y liberando su relacion con equipos.")
    const response = await fetch(`/api/coaches/${coachToDelete.id}`, {
      method: "DELETE",
    })
    const result = await response.json()
    closeProgress()

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "No fue posible eliminar el entrenador",
        description: result.error || "La eliminacion no pudo completarse.",
      })
      return
    }

    const deletedCoachName = coachToDelete.name
    setCoachToDelete(null)
    await loadData()

    toast({
      title: "Entrenador eliminado",
      description: `${deletedCoachName} fue eliminado correctamente.`,
    })
  }

  const canManage = user?.role === "admin"
  const availableSpecialties = Array.from(new Set(coaches.map((coach) => coach.specialty).filter(Boolean))).sort()
  const filteredCoaches = coaches.filter((coach) => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      coach.name.toLowerCase().includes(normalizedSearch) ||
      coach.email.toLowerCase().includes(normalizedSearch)
    const matchesSpecialty = specialtyFilter === "all" || (coach.specialty || "") === specialtyFilter
    const matchesAssignment =
      assignmentFilter === "all" ||
      (assignmentFilter === "assigned" ? Boolean(coach.teamName) : !coach.teamName)

    return matchesSearch && matchesSpecialty && matchesAssignment
  })

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
              <CardDescription>Gestion de directores tecnicos y equipo asignado</CardDescription>
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
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre o email"
            />
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las especialidades</SelectItem>
                {availableSpecialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty!}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por equipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="assigned">Con equipo</SelectItem>
                <SelectItem value="unassigned">Sin equipo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCoaches.map((coach) => (
              <Card key={coach.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={coach.photo || "/placeholder.svg"} alt={coach.name} />
                      <AvatarFallback>
                        <ClipboardList className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{coach.name}</h3>
                      {coach.license && <p className="text-sm text-muted-foreground">{coach.license}</p>}
                      <Badge variant="secondary" className="mt-1">
                        {coach.experience} años
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    {coach.specialty && <p className="font-medium text-green-600">{coach.specialty}</p>}
                    <p className="text-muted-foreground">{coach.email}</p>
                    {coach.phone && <p className="text-muted-foreground">{coach.phone}</p>}
                    <p className="text-muted-foreground">Equipo: {coach.teamName || "Sin equipo asignado"}</p>
                  </div>
                  {canManage && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(coach)} className="flex-1">
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setCoachToDelete(coach)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredCoaches.length === 0 && (
            <div className="py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No se encontraron entrenadores</h3>
              <p className="text-muted-foreground">Ajusta la busqueda o los filtros para ver resultados</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CoachDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        coach={selectedCoach}
        teams={teams}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <Dialog open={Boolean(coachToDelete)} onOpenChange={(open) => !open && setCoachToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar entrenador</DialogTitle>
            <DialogDescription>
              {coachToDelete
                ? `Se eliminara ${coachToDelete.name}. Si esta asignado a un equipo, la relacion se quitara automaticamente.`
                : "Confirma la eliminacion del entrenador."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => void handleDelete()} className="flex-1">
              Eliminar
            </Button>
            <Button variant="outline" onClick={() => setCoachToDelete(null)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProgressDialog open={progressState.open} title={progressState.title} description={progressState.description} />
    </div>
  )
}
