"use client"

import { useState, useEffect } from "react"
import { getPlayers } from "@/lib/storage"
import type { Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AssignPlayerDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (playerId: string) => void
}

export function AssignPlayerDialog({ teamId, open, onOpenChange, onAssign }: AssignPlayerDialogProps) {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])

  useEffect(() => {
    if (open) {
      loadAvailablePlayers()
    }
  }, [open, teamId])

  const loadAvailablePlayers = () => {
    const allPlayers = getPlayers()
    const playersWithoutTeam = allPlayers.filter((p) => !p.teamId || p.teamId === "")
    setAvailablePlayers(playersWithoutTeam)
  }

  const handleAssign = (playerId: string) => {
    onAssign(playerId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar Jugador Existente
          </DialogTitle>
          <DialogDescription>Selecciona un jugador sin equipo para agregarlo a esta plantilla</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {availablePlayers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No hay jugadores disponibles</p>
                <p className="text-sm text-muted-foreground text-center">
                  Todos los jugadores ya están asignados a un equipo o necesitas crear nuevos jugadores primero
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {availablePlayers.map((player) => (
                <Card key={player.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary">
                          <AvatarImage src={player.photo || "/placeholder.svg"} alt={player.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold">
                            {player.number}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{player.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{player.position}</span>
                            <span>•</span>
                            <span>#{player.number}</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleAssign(player.id)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
