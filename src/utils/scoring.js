// ============================================================
// SISTEMA DE PUNTUACIÓN
// Tabla principal: ganar +1, MVP +1, arquero <3 goles +2
// Tabla alterna:   solo ganar +1  (MVP/arquero = info, sin puntos)
// Extra Player: externo para completar 5v5, no suma puntos
// ============================================================

export const PLAYERS = [
  'Santiago', 'Simon', 'Julian', 'Daniel',
  'Winston', 'Coste', 'Harold', 'Sebastian', 'Sergio'
]

export const EXTRA_PLAYER_NAME = 'Extra Player'

export const INITIAL_STATS = () =>
  PLAYERS.reduce((acc, p) => ({
    ...acc,
    [p]: { pts: 0, altPts: 0, wins: 0, losses: 0, gamesPlayed: 0, mvpCount: 0, keeperBonusCount: 0 }
  }), {})

/** Puntos tabla PRINCIPAL por partido */
export function calculateMatchPoints(match) {
  if (!match || !match.completed) return {}
  const { team1, team2, goals1, goals2, mvp1, mvp2, keeper1, keeper2 } = match
  if (goals1 === goals2) return {}

  const winnerTeam = goals1 > goals2 ? team1 : team2
  const points = {}

  winnerTeam.forEach(p => { if (PLAYERS.includes(p)) points[p] = (points[p] || 0) + 1 })

  if (mvp1 && PLAYERS.includes(mvp1) && team1.includes(mvp1))
    points[mvp1] = (points[mvp1] || 0) + 1
  if (mvp2 && PLAYERS.includes(mvp2) && team2.includes(mvp2))
    points[mvp2] = (points[mvp2] || 0) + 1

  if (keeper1 && PLAYERS.includes(keeper1) && team1.includes(keeper1) && goals2 < 3)
    points[keeper1] = (points[keeper1] || 0) + 2
  if (keeper2 && PLAYERS.includes(keeper2) && team2.includes(keeper2) && goals1 < 3)
    points[keeper2] = (points[keeper2] || 0) + 2

  return points
}

/** Puntos tabla ALTERNA por partido — solo victorias */
export function calculateAltPoints(match) {
  if (!match || !match.completed) return {}
  const { team1, team2, goals1, goals2 } = match
  if (goals1 === goals2) return {}

  const winnerTeam = goals1 > goals2 ? team1 : team2
  const points = {}
  winnerTeam.forEach(p => { if (PLAYERS.includes(p)) points[p] = 1 })
  return points
}

export function recalculateAllStats(matches) {
  const stats = INITIAL_STATS()

  matches.filter(m => m.completed).forEach(match => {
    const pts    = calculateMatchPoints(match)
    const altPts = calculateAltPoints(match)
    const { team1, team2, goals1, goals2, mvp1, mvp2, keeper1, keeper2 } = match

    const winnerTeam = goals1 > goals2 ? team1 : team2
    const loserTeam  = goals1 > goals2 ? team2 : team1
    const winnerMVP  = goals1 > goals2 ? mvp1 : mvp2
    const loserMVP   = goals1 > goals2 ? mvp2 : mvp1

    ;[...team1, ...team2].forEach(p => {
      if (!stats[p]) return
      stats[p].gamesPlayed++
      stats[p].pts    += (pts[p]    || 0)
      stats[p].altPts += (altPts[p] || 0)
    })

    winnerTeam.forEach(p => { if (stats[p]) stats[p].wins++ })
    loserTeam.forEach(p  => { if (stats[p]) stats[p].losses++ })

    if (winnerMVP && stats[winnerMVP]) stats[winnerMVP].mvpCount++
    if (loserMVP  && stats[loserMVP] && loserMVP !== winnerMVP) stats[loserMVP].mvpCount++

    // Contar bonos de arquero
    if (keeper1 && stats[keeper1] && goals2 < 3) stats[keeper1].keeperBonusCount++
    if (keeper2 && stats[keeper2] && goals1 < 3) stats[keeper2].keeperBonusCount++
  })

  return stats
}

export function getPickOrder(stats) {
  const ranked = [...PLAYERS].sort((a, b) => {
    if (stats[b].pts !== stats[a].pts) return stats[b].pts - stats[a].pts
    if (stats[b].wins !== stats[a].wins) return stats[b].wins - stats[a].wins
    return a.localeCompare(b)
  })
  const last = ranked.slice(-2).reverse()
  const rest = ranked.slice(0, -2)
  return { captains: last, pickOrder: [...last, ...rest] }
}

export function autoAssignTeams(stats) {
  const { captains, pickOrder } = getPickOrder(stats)
  const team1 = [captains[0]]
  const team2 = [captains[1]]
  const rest = pickOrder.filter(p => !captains.includes(p))
  rest.forEach((p, i) => { i % 2 === 0 ? team2.push(p) : team1.push(p) })
  return { team1: team1.slice(0, 4), team2: team2.slice(0, 5), shortTeam: 1 }
}

export function randomShuffleTeams() {
  const shuffled = [...PLAYERS].sort(() => Math.random() - 0.5)
  return { team1: shuffled.slice(0, 4), team2: shuffled.slice(4, 9), shortTeam: 1 }
}

/** Ranking tabla principal */
export function getRanking(stats) {
  return [...PLAYERS].map(p => ({ name: p, ...stats[p] }))
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if (b.wins !== a.wins) return b.wins - a.wins
      return a.name.localeCompare(b.name)
    })
}

/** Ranking tabla alterna (solo victorias) */
export function getAltRanking(stats) {
  return [...PLAYERS].map(p => ({ name: p, ...stats[p] }))
    .sort((a, b) => {
      if (b.altPts !== a.altPts) return b.altPts - a.altPts
      if (b.wins !== a.wins) return b.wins - a.wins
      return a.name.localeCompare(b.name)
    })
}
