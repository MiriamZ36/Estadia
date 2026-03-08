"use client"

import { useEffect, useState } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Users } from "lucide-react"

interface AssignPlayerDialogProps {
  teamId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssign: (playerId: string) => Promise<void>
}

export function AssignPlayerDialog({ teamId, open, onOpenChange, onAssign }: AssignPlayerDialogProps) {
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])

  useEffect(() => {
    if (open) {
      void loadAvailablePlayers()
    }
  }, [open, teamId])

  const loadAvailablePlayers = async () => {
    const response = await fetch("/api/players", {
      cache: "no-store",
    })
    const result = await response.json()

    if (!response.ok) {
      setAvailablePlayers([])
      return
    }

    setAvailablePlayers((result.players || []).filter((player: Player) => player.teamId !== teamId))
  }

  const handleAssign = async (playerId: string) => {
    await onAssign(playerId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Reasignar Jugador
          </DialogTitle>
          <DialogDescription>
            Selecciona un jugador existente para moverlo a esta plantilla.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {availablePlayers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-lg font-medium">No hay jugadores disponibles</p>
                <p className="text-center text-sm text-muted-foreground">
                  Primero crea jugadores en otro equipo para poder reasignarlos aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {availablePlayers.map((player) => (
                <Card key={player.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary">
                          <AvatarImage src={player.photo || "/placeholder.svg"} alt={player.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 font-bold text-white">
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
                      <Button size="sm" onClick={() => void handleAssign(player.id)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Mover
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
