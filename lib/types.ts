export type UserRole = "admin" | "referee" | "coach" | "fan"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  photo?: string // Added photo field for user profile pictures
}

export interface Tournament {
  id: string
  name: string
  format: "5" | "7" | "11"
  startDate: string
  endDate: string
  status: "upcoming" | "active" | "completed"
  organizerId: string
  rules?: string
  teamIds: string[] // Equipos participantes en el torneo
}

export interface Team {
  id: string
  name: string
  tournamentId: string
  logo?: string
  foundedDate?: string
  coachId?: string
}

export interface Player {
  id: string
  name: string
  teamId: string
  position: string
  number: number
  photo?: string
  birthDate?: string
  nationality?: string
  height?: number // in cm
  weight?: number // in kg
  dominantFoot?: "left" | "right" | "both"
  email?: string
  phone?: string
  emergencyContact?: string
  bloodType?: string
  medicalNotes?: string
}

export interface Referee {
  id: string
  name: string
  photo?: string
  license: string
  experience: number
  email: string
  phone?: string
}

export interface Coach {
  id: string
  name: string
  photo?: string
  license?: string
  experience: number
  email: string
  phone?: string
  specialty?: string
}

export interface Match {
  id: string
  tournamentId: string
  homeTeamId: string
  awayTeamId: string
  date: string
  time: string
  venue: string
  status: "scheduled" | "live" | "finished"
  homeScore?: number
  awayScore?: number
  refereeId?: string
}

export interface MatchEvent {
  id: string
  matchId: string
  type: "goal" | "yellow_card" | "red_card" | "substitution"
  playerId: string
  teamId: string
  minute: number
  description?: string
}

export interface Standing {
  teamId: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}
