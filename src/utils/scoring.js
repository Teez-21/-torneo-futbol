// ============================================================
// SISTEMA DE PUNTUACIÓN DEL TORNEO
// ============================================================
// Parte del equipo ganador: +1 punto
// MVP (cualquier equipo):   +1 punto adicional
// Arquero con <3 goles recibidos (cualquier equipo): +2 puntos
//
// EXTRA PLAYER: jugador externo (no registrado) que se agrega
// para completar 5v5 cuando un equipo queda con 4. No aparece
// en la tabla y no acumula puntos nunca.
// ============================================================

export const PLAYERS = [
  'Santiago', 'Simon', 'Julian', 'Daniel',
  'Winston', 'Coste', 'Harold', 'Sebastian', 'Sergio'
]

export const EXTRA_PLAYER_NAME = 'Extra Player'

export const INITIAL_STATS = () =>
  PLAYERS.reduce((acc, p) => ({
    ...acc,
    [p]: { pts: 0, wins: 0, losses: 0, gamesPlayed: 0, mvpCount: 0 }
  }), {})

/**
 * Calcula los puntos que gana cada jugador REGISTRADO en un partido.
 * El Extra Player nunca recibe puntos.
 */
export function calculateMatchPoints(match) {
  if (!match || !match.completed) return {}

  const { team1, team2, goals1, goals2, mvp1, mvp2, keeper1, keeper2 } = match

  if (goals1 === goals2) return {}

  const winnerTeam = goals1 > goals2 ? team1 : team2
  const points = {}

  // +1 por pertenecer al equipo ganador (solo jugadores registrados)
  winnerTeam.forEach(p => {
    if (PLAYERS.includes(p)) points[p] = (points[p] || 0) + 1
  })

  // MVP equipo 1: +1 (solo si es jugador registrado)
  if (mvp1 && PLAYERS.includes(mvp1) && team1.includes(mvp1)) {
    points[mvp1] = (points[mvp1] || 0) + 1
  }

  // MVP equipo 2: +1
  if (mvp2 && PLAYERS.includes(mvp2) && team2.includes(mvp2)) {
    points[mvp2] = (points[mvp2] || 0) + 1
  }

  // Arquero equipo 1 con <3 goles recibidos: +2
  const goalsVsKeeper1 = goals2
  if (keeper1 && PLAYERS.includes(keeper1) && team1.includes(keeper1) && goalsVsKeeper1 < 3) {
    points[keeper1] = (points[keeper1] || 0) + 2
  }

  // Arquero equipo 2 con <3 goles recibidos: +2
  const goalsVsKeeper2 = goals1
  if (keeper2 && PLAYERS.includes(keeper2) && team2.includes(keeper2) && goalsVsKeeper2 < 3) {
    points[keeper2] = (points[keeper2] || 0) + 2
  }

  return points
}

export function recalculateAllStats(matches) {
  const stats = INITIAL_STATS()

  matches.filter(m => m.completed).forEach(match => {
    const pts = calculateMatchPoints(match)
    const { team1, team2, goals1, goals2, mvp1, mvp2 } = match

    const winnerTeam = goals1 > goals2 ? team1 : team2
    const loserTeam  = goals1 > goals2 ? team2 : team1
    const winnerMVP  = goals1 > goals2 ? mvp1 : mvp2
    const loserMVP   = goals1 > goals2 ? mvp2 : mvp1

    // Solo contar jugadores registrados (no Extra Player)
    ;[...team1, ...team2].forEach(p => {
      if (stats[p]) {
        stats[p].gamesPlayed++
        stats[p].pts += (pts[p] || 0)
      }
    })

    winnerTeam.forEach(p => { if (stats[p]) stats[p].wins++ })
    loserTeam.forEach(p  => { if (stats[p]) stats[p].losses++ })

    if (winnerMVP && stats[winnerMVP]) stats[winnerMVP].mvpCount++
    if (loserMVP && stats[loserMVP] && loserMVP !== winnerMVP) stats[loserMVP].mvpCount++
  })

  return stats
}

/**
 * Selección automática: los dos últimos en tabla eligen primero.
 * Devuelve los 9 jugadores registrados distribuidos en 2 equipos (4 vs 5).
 * El equipo de 4 tendrá el slot para Extra Player marcado.
 */
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

  rest.forEach((p, i) => {
    if (i % 2 === 0) team2.push(p)
    else team1.push(p)
  })

  // team1 = 4 jugadores, team2 = 5 jugadores
  // team1 necesita Extra Player para 5v5
  return { team1: team1.slice(0, 4), team2: team2.slice(0, 5), shortTeam: 1 }
}

/**
 * Sorteo aleatorio de los 9 jugadores en 2 equipos.
 * Un equipo queda con 4 y el otro con 5.
 * shortTeam indica cuál equipo tiene 4 (y necesita Extra Player).
 */
export function randomShuffleTeams() {
  const shuffled = [...PLAYERS].sort(() => Math.random() - 0.5)
  const team1 = shuffled.slice(0, 4)
  const team2 = shuffled.slice(4, 9)
  return { team1, team2, shortTeam: 1 } // team1 tiene 4, necesita extra
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
