import type { Tournament, Team, Player, Match, MatchEvent, Standing, Referee, Coach } from "./types"

const STORAGE_KEYS = {
  TOURNAMENTS: "ligasmart_tournaments",
  TEAMS: "ligasmart_teams",
  PLAYERS: "ligasmart_players",
  MATCHES: "ligasmart_matches",
  EVENTS: "ligasmart_events",
  STANDINGS: "ligasmart_standings",
  REFEREES: "ligasmart_referees", // Nueva clave para árbitros
  COACHES: "ligasmart_coaches", // Nueva clave para entrenadores
}

// Tournaments
export const getTournaments = (): Tournament[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.TOURNAMENTS) || "[]")
}

export const saveTournament = (tournament: Tournament) => {
  const tournaments = getTournaments()
  const index = tournaments.findIndex((t) => t.id === tournament.id)
  if (index >= 0) {
    tournaments[index] = tournament
  } else {
    tournaments.push(tournament)
  }
  localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments))
}

export const deleteTournament = (id: string) => {
  const tournaments = getTournaments().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments))
}

// Teams
export const getTeams = (tournamentId?: string): Team[] => {
  const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.TEAMS) || "[]")
  return tournamentId ? teams.filter((t: Team) => t.tournamentId === tournamentId) : teams
}

export const saveTeam = (team: Team) => {
  const teams = getTeams()
  const index = teams.findIndex((t) => t.id === team.id)
  if (index >= 0) {
    teams[index] = team
  } else {
    teams.push(team)
  }
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams))
}

export const deleteTeam = (id: string) => {
  const teams = getTeams().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams))
}

// Players
export const getPlayers = (teamId?: string): Player[] => {
  const players = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYERS) || "[]")
  return teamId ? players.filter((p: Player) => p.teamId === teamId) : players
}

export const savePlayer = (player: Player) => {
  const players = getPlayers()
  const index = players.findIndex((p) => p.id === player.id)
  if (index >= 0) {
    players[index] = player
  } else {
    players.push(player)
  }
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players))
}

export const deletePlayer = (id: string) => {
  const players = getPlayers().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players))
}

// Matches
export const getMatches = (tournamentId?: string): Match[] => {
  const matches = JSON.parse(localStorage.getItem(STORAGE_KEYS.MATCHES) || "[]")
  return tournamentId ? matches.filter((m: Match) => m.tournamentId === tournamentId) : matches
}

export const saveMatch = (match: Match) => {
  const matches = getMatches()
  const index = matches.findIndex((m) => m.id === match.id)
  if (index >= 0) {
    matches[index] = match
  } else {
    matches.push(match)
  }
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches))
}

// Match Events
export const getMatchEvents = (matchId: string): MatchEvent[] => {
  const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || "[]")
  return events.filter((e: MatchEvent) => e.matchId === matchId)
}

export const saveMatchEvent = (event: MatchEvent) => {
  const events = JSON.parse(localStorage.getItem(STORAGE_KEYS.EVENTS) || "[]")
  events.push(event)
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events))
}

// Standings
export const getStandings = (tournamentId: string): Standing[] => {
  const standings = JSON.parse(localStorage.getItem(STORAGE_KEYS.STANDINGS) || "{}")
  return standings[tournamentId] || []
}

export const updateStandings = (tournamentId: string, standings: Standing[]) => {
  const allStandings = JSON.parse(localStorage.getItem(STORAGE_KEYS.STANDINGS) || "{}")
  allStandings[tournamentId] = standings
  localStorage.setItem(STORAGE_KEYS.STANDINGS, JSON.stringify(allStandings))
}

// Referees
export const getReferees = (): Referee[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.REFEREES) || "[]")
}

export const saveReferee = (referee: Referee) => {
  const referees = getReferees()
  const index = referees.findIndex((r) => r.id === referee.id)
  if (index >= 0) {
    referees[index] = referee
  } else {
    referees.push(referee)
  }
  localStorage.setItem(STORAGE_KEYS.REFEREES, JSON.stringify(referees))
}

export const deleteReferee = (id: string) => {
  const referees = getReferees().filter((r) => r.id !== id)
  localStorage.setItem(STORAGE_KEYS.REFEREES, JSON.stringify(referees))
}

// Coaches
export const getCoaches = (): Coach[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.COACHES) || "[]")
}

export const saveCoach = (coach: Coach) => {
  const coaches = getCoaches()
  const index = coaches.findIndex((c) => c.id === coach.id)
  if (index >= 0) {
    coaches[index] = coach
  } else {
    coaches.push(coach)
  }
  localStorage.setItem(STORAGE_KEYS.COACHES, JSON.stringify(coaches))
}

export const deleteCoach = (id: string) => {
  const coaches = getCoaches().filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEYS.COACHES, JSON.stringify(coaches))
}

// Clear all local storage data
export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key)
  })
}

export const clearDataExceptUsers = () => {
  const users = localStorage.getItem("ligasmart_users")
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key)
  })
  if (users) {
    localStorage.setItem("ligasmart_users", users)
  }
}
