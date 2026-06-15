// ============================================================
// SISTEMA DE PUNTUACIÓN DEL TORNEO
// ============================================================
// Parte del equipo ganador: +1 punto
// MVP (cualquier equipo):   +1 punto adicional
// Arquero con <3 goles recibidos (cualquier equipo): +2 puntos
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

  const { team1, team2, goals1, goals2, mvp1, mvp2, keeper1, keeper2, extraPlayer } = match

  if (goals1 === goals2) return {}

  const winnerTeam = goals1 > goals2 ? team1 : team2

  const points = {}

  // +1 por pertenecer al equipo ganador (excluyendo extra player)
  winnerTeam.forEach(p => {
    if (p !== extraPlayer) points[p] = (points[p] || 0) + 1
  })

  // MVP equipo 1: +1 (no puede ser el extra player)
  if (mvp1 && team1.includes(mvp1) && mvp1 !== extraPlayer) {
    points[mvp1] = (points[mvp1] || 0) + 1
  }

  // MVP equipo 2: +1
  if (mvp2 && team2.includes(mvp2) && mvp2 !== extraPlayer) {
    points[mvp2] = (points[mvp2] || 0) + 1
  }

  // Arquero equipo 1 con <3 goles recibidos: +2 (no puede ser el extra player)
  const goalsAgainstKeeper1 = goals2
  if (keeper1 && team1.includes(keeper1) && keeper1 !== extraPlayer && goalsAgainstKeeper1 < 3) {
    points[keeper1] = (points[keeper1] || 0) + 2
  }

  // Arquero equipo 2 con <3 goles recibidos: +2
  const goalsAgainstKeeper2 = goals1
  if (keeper2 && team2.includes(keeper2) && keeper2 !== extraPlayer && goalsAgainstKeeper2 < 3) {
    points[keeper2] = (points[keeper2] || 0) + 2
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
    const { team1, team2, goals1, goals2, mvp1, mvp2, extraPlayer } = match

    const winnerTeam = goals1 > goals2 ? team1 : team2
    const loserTeam  = goals1 > goals2 ? team2 : team1
    const winnerMVP  = goals1 > goals2 ? mvp1  : mvp2

    ;[...team1, ...team2].forEach(p => {
      if (stats[p] && p !== extraPlayer) {
        stats[p].gamesPlayed++
        stats[p].pts += (pts[p] || 0)
      }
    })

    winnerTeam.forEach(p => { if (stats[p] && p !== extraPlayer) stats[p].wins++ })
    loserTeam.forEach(p  => { if (stats[p] && p !== extraPlayer) stats[p].losses++ })

    if (winnerMVP && stats[winnerMVP] && winnerMVP !== extraPlayer) stats[winnerMVP].mvpCount++
    const loserMVP = goals1 > goals2 ? mvp2 : mvp1
    if (loserMVP && stats[loserMVP] && loserMVP !== extraPlayer && loserMVP !== winnerMVP) {
      stats[loserMVP].mvpCount++
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

/**
 * Sortea equipos completamente al azar 5v5
 * El jugador #10 es "Extra Player" (relleno, no aparece en tabla de puntos)
 */
export function randomShuffleTeams() {
  const shuffled = [...PLAYERS].sort(() => Math.random() - 0.5)
  const team1 = shuffled.slice(0, 4)
  const team2 = shuffled.slice(4, 8)
  // El noveno jugador va al equipo 1 como Extra Player para 5v4,
  // pero marcamos al extra separado para no sumarle puntos
  const extraPlayer = shuffled[8]
  team1.push(extraPlayer)
  return { team1, team2, extraPlayer }
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
