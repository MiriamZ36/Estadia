"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useLoading } from "@/lib/loading-context"
import { getTournaments, saveTournament, deleteTournament } from "@/lib/storage"
import type { Tournament } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Calendar, Trophy } from "lucide-react"
import { TournamentDialog } from "./tournament-dialog"
import { TournamentDetail } from "./tournament-detail"

export function TournamentList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { startLoading, stopLoading } = useLoading()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [viewingTournament, setViewingTournament] = useState<Tournament | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = () => {
    const data = getTournaments()
    setTournaments(data)
  }

  const handleSave = (tournament: Tournament) => {
    try {
      startLoading(tournament.id ? "Actualizando torneo..." : "Creando torneo...")
      saveTournament(tournament)
      loadTournaments()
      setIsDialogOpen(false)
      setSelectedTournament(null)
      toast({
        title: tournament.id ? "Torneo actualizado" : "Torneo creado",
        description: `${tournament.name} ha sido ${tournament.id ? "actualizado" : "creado"} exitosamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el torneo.",
        variant: "destructive",
      })
    } finally {
      stopLoading()
    }
  }

  const handleEdit = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const tournament = tournaments.find((t) => t.id === id)
    if (confirm("¿Estás seguro de eliminar este torneo?")) {
      try {
        startLoading("Eliminando torneo...")
        deleteTournament(id)
        loadTournaments()
        toast({
          title: "Torneo eliminado",
          description: `${tournament?.name || "El torneo"} ha sido eliminado exitosamente.`,
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Ocurrió un error al eliminar el torneo.",
          variant: "destructive",
        })
      } finally {
        stopLoading()
      }
    }
  }

  const handleCreate = () => {
    setSelectedTournament(null)
    setIsDialogOpen(true)
  }

  const handleView = (tournament: Tournament) => {
    setViewingTournament(tournament)
  }

  const handleBackToList = () => {
    setViewingTournament(null)
    loadTournaments()
  }

  const getStatusBadge = (status: Tournament["status"]) => {
    const variants = {
      upcoming: "secondary",
      active: "default",
      completed: "outline",
    } as const

    const labels = {
      upcoming: "Próximo",
      active: "En curso",
      completed: "Finalizado",
    }

    return <Badge variant={variants[status] || "secondary"}>{labels[status]}</Badge>
  }

  const canManage = user?.role === "admin"

  if (viewingTournament) {
    return <TournamentDetail tournament={viewingTournament} onBack={handleBackToList} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Torneos</h2>
          <p className="text-muted-foreground">Gestiona y visualiza los torneos de fútbol</p>
        </div>
        {canManage && (
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Torneo
          </Button>
        )}
      </div>

      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay torneos registrados</p>
            <p className="text-sm text-muted-foreground mb-4">Comienza creando tu primer torneo</p>
            {canManage && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Torneo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{tournament.name}</CardTitle>
                    <CardDescription className="mt-2">Formato: Fútbol {tournament.format}</CardDescription>
                  </div>
                  {getStatusBadge(tournament.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(tournament.startDate).toLocaleDateString("es-MX")} -{" "}
                      {new Date(tournament.endDate).toLocaleDateString("es-MX")}
                    </span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Trophy className="h-4 w-4 mr-2" />
                    <span>{tournament.teamIds?.length || 0} equipos participantes</span>
                  </div>
                  {tournament.rules && <p className="text-muted-foreground line-clamp-2">{tournament.rules}</p>}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleView(tournament)} className="flex-1">
                    <Trophy className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                  {canManage && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(tournament)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(tournament.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TournamentDialog
        tournament={selectedTournament}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        userId={user?.id || ""}
      />
    </div>
  )
}
