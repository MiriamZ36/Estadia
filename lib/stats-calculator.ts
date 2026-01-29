import type { Match, MatchEvent, Team, Player, Standing } from "./types"

export function calculateStandings(teams: Team[], matches: Match[]): Standing[] {
  const standings: Standing[] = teams.map((team) => ({
    teamId: team.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }))

  matches
    .filter((m) => m.status === "finished")
    .forEach((match) => {
      const homeStanding = standings.find((s) => s.teamId === match.homeTeamId)
      const awayStanding = standings.find((s) => s.teamId === match.awayTeamId)

      if (!homeStanding || !awayStanding) return

      const homeScore = match.homeScore || 0
      const awayScore = match.awayScore || 0

      homeStanding.played++
      awayStanding.played++

      homeStanding.goalsFor += homeScore
      homeStanding.goalsAgainst += awayScore
      awayStanding.goalsFor += awayScore
      awayStanding.goalsAgainst += homeScore

      if (homeScore > awayScore) {
        homeStanding.won++
        homeStanding.points += 3
        awayStanding.lost++
      } else if (awayScore > homeScore) {
        awayStanding.won++
        awayStanding.points += 3
        homeStanding.lost++
      } else {
        homeStanding.drawn++
        awayStanding.drawn++
        homeStanding.points++
        awayStanding.points++
      }

      homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst
      awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst
    })

  return standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    return b.goalsFor - a.goalsFor
  })
}

export function calculatePlayerStats(
  players: Player[],
  events: MatchEvent[],
): Array<Player & { goals: number; yellowCards: number; redCards: number }> {
  return players.map((player) => {
    const playerEvents = events.filter((e) => e.playerId === player.id)
    return {
      ...player,
      goals: playerEvents.filter((e) => e.type === "goal").length,
      yellowCards: playerEvents.filter((e) => e.type === "yellow_card").length,
      redCards: playerEvents.filter((e) => e.type === "red_card").length,
    }
  })
}

export function predictMatchResult(
  homeTeam: Standing,
  awayTeam: Standing,
): { home: number; draw: number; away: number } {
  const homeStrength = homeTeam.points + homeTeam.goalDifference * 0.5
  const awayStrength = awayTeam.points + awayTeam.goalDifference * 0.5

  const total = homeStrength + awayStrength + 10

  let homeProbability = ((homeStrength + 5) / total) * 100
  let awayProbability = ((awayStrength + 5) / total) * 100
  let drawProbability = 100 - homeProbability - awayProbability

  if (drawProbability < 15) {
    drawProbability = 15
    const remaining = 85
    const ratio = homeProbability / (homeProbability + awayProbability)
    homeProbability = remaining * ratio
    awayProbability = remaining * (1 - ratio)
  }

  return {
    home: Math.round(homeProbability),
    draw: Math.round(drawProbability),
    away: Math.round(awayProbability),
  }
}

export function getTeamForm(teamId: string, matches: Match[]): string {
  const teamMatches = matches
    .filter((m) => m.status === "finished" && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return teamMatches
    .map((match) => {
      const isHome = match.homeTeamId === teamId
      const teamScore = isHome ? match.homeScore : match.awayScore
      const opponentScore = isHome ? match.awayScore : match.homeScore

      if ((teamScore || 0) > (opponentScore || 0)) return "W"
      if ((teamScore || 0) < (opponentScore || 0)) return "L"
      return "D"
    })
    .join("")
}
