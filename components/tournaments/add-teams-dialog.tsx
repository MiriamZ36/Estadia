"use client"

import { useState } from "react"
import type { Team } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trophy, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface AddTeamsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableTeams: Team[]
  onAdd: (teamIds: string[]) => void
}

export function AddTeamsDialog({ open, onOpenChange, availableTeams, onAdd }: AddTeamsDialogProps) {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const handleToggleTeam = (teamId: string) => {
    setSelectedTeams((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]))
  }

  const handleSelectAll = () => {
    if (selectedTeams.length === filteredTeams.length) {
      setSelectedTeams([])
    } else {
      setSelectedTeams(filteredTeams.map((team) => team.id))
    }
  }

  const handleSubmit = () => {
    if (selectedTeams.length > 0) {
      onAdd(selectedTeams)
      setSelectedTeams([])
      setSearchQuery("")
    }
  }

  const handleCancel = () => {
    setSelectedTeams([])
    setSearchQuery("")
    onOpenChange(false)
  }

  const filteredTeams = availableTeams.filter((team) => team.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agregar Equipos al Torneo</DialogTitle>
          <DialogDescription>
            Selecciona los equipos que participarán en el torneo. Puedes elegir múltiples equipos a la vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar equipos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredTeams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {availableTeams.length === 0 ? "No hay equipos disponibles" : "No se encontraron equipos"}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">
                  {selectedTeams.length} de {filteredTeams.length} seleccionados
                </span>
                <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                  {selectedTeams.length === filteredTeams.length ? "Deseleccionar todos" : "Seleccionar todos"}
                </Button>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {filteredTeams.map((team) => (
                    <div
                      key={team.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleToggleTeam(team.id)}
                    >
                      <Checkbox
                        checked={selectedTeams.includes(team.id)}
                        onCheckedChange={() => handleToggleTeam(team.id)}
                      />
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        {team.logo ? (
                          <img
                            src={team.logo || "/placeholder.svg"}
                            alt={team.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <Trophy className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{team.name}</p>
                        {team.foundedDate && (
                          <p className="text-sm text-muted-foreground">
                            Fundado: {new Date(team.foundedDate).getFullYear()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={selectedTeams.length === 0}>
            Agregar {selectedTeams.length > 0 && `(${selectedTeams.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
