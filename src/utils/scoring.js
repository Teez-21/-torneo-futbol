// ============================================================
// SISTEMA DE PUNTUACIÓN DEL TORNEO
// ============================================================
// Ganador: 1 punto
// Perdedor: 0 puntos
// MVP equipo ganador: +2 puntos
// MVP equipo perdedor: +1 punto
// Arquero ganador con <3 goles recibidos: +2 puntos
// Arquero perdedor con <3 goles recibidos: +1 punto
// ============================================================

export const PLAYERS = [
  'Santiago', 'Simon', 'Julian', 'Daniel',
  'Winston', 'Coste', 'Harold', 'Sebastian', 'Sergio'
]

export const INITIAL_STATS = () =>
  PLAYERS.reduce((acc, p) => ({
    ...acc,
    [p]: { pts: 0, wins: 0, losses: 0, gamesPlayed: 0, mvpCount: 0 }
  }), {})

/**
 * Calcula los puntos que gana cada jugador en un partido
 * @param {Object} match - El objeto del partido
 * @returns {Object} mapa jugador -> puntos ganados en este partido
 */
export function calculateMatchPoints(match) {
  if (!match || !match.completed) return {}

  const {
    team1, team2,
    goals1, goals2,
    mvp1, mvp2,
    keeper1, keeper2
  } = match

  // No hay empates
  if (goals1 === goals2) return {}

  const winnerTeam = goals1 > goals2 ? team1 : team2
  const loserTeam  = goals1 > goals2 ? team2 : team1
  const goalsAgainstWinnerKeeper = goals1 > goals2 ? goals2 : goals1
  const goalsAgainstLoserKeeper  = goals1 > goals2 ? goals1 : goals2
  const winnerMVP  = goals1 > goals2 ? mvp1  : mvp2
  const loserMVP   = goals1 > goals2 ? mvp2  : mvp1
  const winnerKeeper = goals1 > goals2 ? keeper1 : keeper2
  const loserKeeper  = goals1 > goals2 ? keeper2 : keeper1

  const points = {}

  // Puntos por ganar/perder
  winnerTeam.forEach(p => { points[p] = (points[p] || 0) + 1 })
  loserTeam.forEach(p  => { points[p] = (points[p] || 0) + 0 })

  // MVP ganador: +2
  if (winnerMVP && winnerTeam.includes(winnerMVP)) {
    points[winnerMVP] = (points[winnerMVP] || 0) + 2
  }

  // MVP perdedor: +1
  if (loserMVP && loserTeam.includes(loserMVP)) {
    points[loserMVP] = (points[loserMVP] || 0) + 1
  }

  // Arquero ganador con <3 goles recibidos: +2
  if (winnerKeeper && winnerTeam.includes(winnerKeeper) && goalsAgainstWinnerKeeper < 3) {
    points[winnerKeeper] = (points[winnerKeeper] || 0) + 2
  }

  // Arquero perdedor con <3 goles recibidos: +1
  if (loserKeeper && loserTeam.includes(loserKeeper) && goalsAgainstLoserKeeper < 3) {
    points[loserKeeper] = (points[loserKeeper] || 0) + 1
  }

  return points
}

/**
 * Recalcula las estadísticas globales desde cero a partir de todos los partidos
 */
export function recalculateAllStats(matches) {
  const stats = INITIAL_STATS()

  matches.filter(m => m.completed).forEach(match => {
    const pts = calculateMatchPoints(match)
    const { team1, team2, goals1, goals2, mvp1, mvp2 } = match

    const winnerTeam = goals1 > goals2 ? team1 : team2
    const loserTeam  = goals1 > goals2 ? team2 : team1
    const winnerMVP  = goals1 > goals2 ? mvp1  : mvp2

    ;[...team1, ...team2].forEach(p => {
      if (stats[p]) {
        stats[p].gamesPlayed++
        stats[p].pts += (pts[p] || 0)
      }
    })

    winnerTeam.forEach(p => { if (stats[p]) stats[p].wins++ })
    loserTeam.forEach(p  => { if (stats[p]) stats[p].losses++ })

    if (winnerMVP && stats[winnerMVP]) stats[winnerMVP].mvpCount++
    if (match.mvp2 && loserTeam.includes(match.mvp2) && stats[match.mvp2]) {
      if (match.mvp2 !== winnerMVP) stats[match.mvp2].mvpCount++
    }
  })

  return stats
}

/**
 * Selección automática de equipos:
 * Los dos últimos en la tabla son los capitanes que eligen primero
 */
export function getPickOrder(stats) {
  const ranked = [...PLAYERS].sort((a, b) => {
    if (stats[b].pts !== stats[a].pts) return stats[b].pts - stats[a].pts
    if (stats[b].wins !== stats[a].wins) return stats[b].wins - stats[a].wins
    return a.localeCompare(b)
  })
  // Los dos últimos eligen primero (son capitanes)
  const last = ranked.slice(-2).reverse()
  const rest = ranked.slice(0, -2)
  return { captains: last, pickOrder: [...last, ...rest] }
}

/**
 * Distribuye jugadores en 2 equipos de forma balanceada según puntos
 * (Los capitanes se asignan al equipo respectivo y van eligiendo)
 */
export function autoAssignTeams(stats) {
  const { captains, pickOrder } = getPickOrder(stats)
  const team1 = [captains[0]]
  const team2 = [captains[1]]
  const rest = pickOrder.filter(p => !captains.includes(p))

  // Asignación alterna empezando desde equipo 2 (el último capitán eligió "primero" al quedar último)
  rest.forEach((p, i) => {
    if (i % 2 === 0) team2.push(p)
    else team1.push(p)
  })

  // Equilibrar si hay 9 jugadores (4 vs 5 o 5 vs 4)
  return { team1: team1.slice(0, 4), team2: team2.slice(0, 5) }
}

export function getRanking(stats) {
  return [...PLAYERS]
    .map(p => ({ name: p, ...stats[p] }))
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if (b.wins !== a.wins) return b.wins - a.wins
      return a.name.localeCompare(b.name)
    })
}
