"use client"

import type React from "react"

import type { Formation, Player } from "./team-builder"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface SoccerFieldProps {
  formation: Formation
  players: Player[]
  onPlayerSelect: (player: Player) => void
  selectedPlayerId?: string
  onPlayerDrop?: (draggedPlayerId: string, targetIndex: number) => void
}

// Coordenadas para las diferentes formaciones (en porcentajes)
const formations: Record<Formation, { x: number; y: number }[]> = {
  "4-3-3": [
    { x: 50, y: 92 }, // GK
    { x: 20, y: 75 }, // DEF 1
    { x: 40, y: 75 }, // DEF 2
    { x: 60, y: 75 }, // DEF 3
    { x: 80, y: 75 }, // DEF 4
    { x: 30, y: 55 }, // MID 1
    { x: 50, y: 55 }, // MID 2
    { x: 70, y: 55 }, // MID 3
    { x: 25, y: 25 }, // FWD 1
    { x: 50, y: 20 }, // FWD 2
    { x: 75, y: 25 }, // FWD 3
  ],
  "4-4-2": [
    { x: 50, y: 92 }, // GK
    { x: 20, y: 75 }, // DEF 1
    { x: 40, y: 75 }, // DEF 2
    { x: 60, y: 75 }, // DEF 3
    { x: 80, y: 75 }, // DEF 4
    { x: 20, y: 50 }, // MID 1
    { x: 40, y: 50 }, // MID 2
    { x: 60, y: 50 }, // MID 3
    { x: 80, y: 50 }, // MID 4
    { x: 35, y: 25 }, // FWD 1
    { x: 65, y: 25 }, // FWD 2
  ],
  "3-5-2": [
    { x: 50, y: 92 }, // GK
    { x: 30, y: 75 }, // DEF 1
    { x: 50, y: 75 }, // DEF 2
    { x: 70, y: 75 }, // DEF 3
    { x: 15, y: 50 }, // MID 1
    { x: 35, y: 50 }, // MID 2
    { x: 50, y: 50 }, // MID 3
    { x: 65, y: 50 }, // MID 4
    { x: 85, y: 50 }, // MID 5
    { x: 35, y: 25 }, // FWD 1
    { x: 65, y: 25 }, // FWD 2
  ],
  "4-2-3-1": [
    { x: 50, y: 92 }, // GK
    { x: 20, y: 75 }, // DEF 1
    { x: 40, y: 75 }, // DEF 2
    { x: 60, y: 75 }, // DEF 3
    { x: 80, y: 75 }, // DEF 4
    { x: 35, y: 60 }, // MID 1
    { x: 65, y: 60 }, // MID 2
    { x: 25, y: 40 }, // MID 3
    { x: 50, y: 40 }, // MID 4
    { x: 75, y: 40 }, // MID 5
    { x: 50, y: 20 }, // FWD 1
  ],
  "5-3-2": [
    { x: 50, y: 92 }, // GK
    { x: 15, y: 75 }, // DEF 1
    { x: 33, y: 75 }, // DEF 2
    { x: 50, y: 75 }, // DEF 3
    { x: 67, y: 75 }, // DEF 4
    { x: 85, y: 75 }, // DEF 5
    { x: 30, y: 50 }, // MID 1
    { x: 50, y: 50 }, // MID 2
    { x: 70, y: 50 }, // MID 3
    { x: 35, y: 25 }, // FWD 1
    { x: 65, y: 25 }, // FWD 2
  ],
}

export default function SoccerField({
  formation,
  players,
  onPlayerSelect,
  selectedPlayerId,
  onPlayerDrop,
}: SoccerFieldProps) {
  const positions = formations[formation]

  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData("playerId", playerId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const draggedPlayerId = e.dataTransfer.getData("playerId")
    if (onPlayerDrop && draggedPlayerId) {
      onPlayerDrop(draggedPlayerId, targetIndex)
    }
  }

  return (
    <div className="relative w-full aspect-[2/3] max-w-2xl mx-auto">
      {/* SVG del campo de fútbol */}
      <svg
        viewBox="0 0 400 600"
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
      >
        {/* Fondo del campo */}
        <rect x="0" y="0" width="400" height="600" fill="#16a34a" rx="8" />

        {/* Patrón de césped */}
        <defs>
          <pattern id="grass" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="20" height="40" fill="#15803d" fillOpacity="0.3" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="400" height="600" fill="url(#grass)" />

        {/* Líneas del campo */}
        <g stroke="white" strokeWidth="2" fill="none" opacity="0.9">
          {/* Perímetro */}
          <rect x="20" y="20" width="360" height="560" rx="4" />

          {/* Línea media */}
          <line x1="20" y1="300" x2="380" y2="300" />

          {/* Círculo central */}
          <circle cx="200" cy="300" r="50" />
          <circle cx="200" cy="300" r="3" fill="white" />

          {/* Área grande superior */}
          <rect x="120" y="20" width="160" height="80" />

          {/* Área pequeña superior */}
          <rect x="160" y="20" width="80" height="40" />

          {/* Punto penal superior */}
          <circle cx="200" cy="80" r="3" fill="white" />

          {/* Área grande inferior */}
          <rect x="120" y="500" width="160" height="80" />

          {/* Área pequeña inferior */}
          <rect x="160" y="540" width="80" height="40" />

          {/* Punto penal inferior */}
          <circle cx="200" cy="520" r="3" fill="white" />

          {/* Arcos de área penal */}
          <path d="M 120 100 A 50 50 0 0 0 280 100" />
          <path d="M 120 500 A 50 50 0 0 1 280 500" />

          {/* Esquinas */}
          <path d="M 20 20 Q 25 20 25 25" />
          <path d="M 380 20 Q 375 20 375 25" />
          <path d="M 20 580 Q 25 580 25 575" />
          <path d="M 380 580 Q 375 580 375 575" />
        </g>

        {/* Arcos */}
        <g stroke="white" strokeWidth="3" fill="none">
          <path d="M 180 20 L 180 10 L 220 10 L 220 20" />
          <path d="M 180 580 L 180 590 L 220 590 L 220 580" />
        </g>
      </svg>

      {/* Jugadores posicionados sobre el campo */}
      {players.slice(0, positions.length).map((player, index) => {
        const pos = positions[index]
        const isSelected = player.id === selectedPlayerId

        return (
          <div
            key={player.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <button
              onClick={() => onPlayerSelect(player)}
              draggable
              onDragStart={(e) => handleDragStart(e, player.id)}
              className={cn(
                "transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white cursor-move",
                isSelected && "scale-125 ring-2 ring-yellow-400",
              )}
            >
              {/* Sombra del jugador */}
              <div className="absolute inset-0 bg-black/20 rounded-full blur-md transform translate-y-2" />

              {/* Avatar del jugador */}
              <Avatar
                className={cn(
                  "h-16 w-16 border-4 border-white shadow-lg transition-all",
                  isSelected && "border-yellow-400",
                )}
              >
                <AvatarImage src={player.photo || "/placeholder.svg"} alt={player.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-lg">
                  {player.number}
                </AvatarFallback>
              </Avatar>

              {/* Nombre y número */}
              <div
                className={cn(
                  "absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap transition-all",
                  isSelected && "scale-110",
                )}
              >
                <div className="bg-white/95 dark:bg-gray-900/95 px-2 py-1 rounded-lg shadow-lg backdrop-blur-sm">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{player.name}</p>
                  <p className="text-[10px] text-muted-foreground">#{player.number}</p>
                </div>
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}
