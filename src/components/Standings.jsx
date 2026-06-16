import { getRanking } from '../utils/scoring'

export default function Standings({ stats, matches, onNewMatch }) {
  if (!stats) return null
  const ranking = getRanking(stats)
  const completedMatches = matches.filter(m => m.completed)
  const totalPts = Object.values(stats).reduce((s, p) => s + p.pts, 0)

  return (
    <div className="page">
      {/* Summary cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-value">{completedMatches.length}</span>
          <span className="summary-label">Jornadas</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{totalPts}</span>
          <span className="summary-label">Pts totales</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">
            {ranking[0]?.pts ?? 0}
          </span>
          <span className="summary-label">Líder pts</span>
        </div>
      </div>

      {/* Podium for top 3 */}
      {completedMatches.length > 0 && (
        <div className="podium">
          {ranking.slice(0, 3).map((p, i) => (
            <div key={p.name} className={`podium-item podium-${i + 1}`}>
              <div className="podium-medal">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
              <div className="podium-name">{p.name}</div>
              <div className="podium-pts">{p.pts} pts</div>
            </div>
          ))}
        </div>
      )}

      {/* Full ranking table */}
      <div className="section-title">Clasificación completa</div>
      <div className="ranking-table">
        <div className="ranking-header">
          <span className="col-pos">#</span>
          <span className="col-name">Jugador</span>
          <span className="col-stat">PJ</span>
          <span className="col-stat">V</span>
          <span className="col-stat">D</span>
          <span className="col-stat highlight">Pts</span>
        </div>
        {ranking.map((player, idx) => {
          const isTop = idx === 0 && completedMatches.length > 0
          const isBottom = idx >= ranking.length - 2 && completedMatches.length > 0
          return (
            <div
              key={player.name}
              className={`ranking-row ${isTop ? 'row-top' : ''} ${isBottom ? 'row-bottom' : ''}`}
            >
              <span className="col-pos">
                {isTop ? '👑' : isBottom ? '⬇' : idx + 1}
              </span>
              <span className="col-name">
                {player.name}
                {player.mvpCount > 0 && (
                  <span className="mvp-badge" title="Veces MVP">⭐{player.mvpCount}</span>
                )}
              </span>
              <span className="col-stat">{player.gamesPlayed}</span>
              <span className="col-stat">{player.wins}</span>
              <span className="col-stat">{player.losses}</span>
              <span className="col-stat highlight">{player.pts}</span>
            </div>
          )
        })}
      </div>

      {/* Points legend */}
      <div className="legend">
        <div className="legend-title">Sistema de puntos</div>
        <div className="legend-item"><span className="legend-dot green" />Ganar partido: +1 pt</div>
        <div className="legend-item"><span className="legend-dot green" />MVP (cualquier equipo): +1 pt</div>
        <div className="legend-item"><span className="legend-dot green" />Arquero con &lt;3 goles recibidos: +2 pts</div>
      </div>

      {completedMatches.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">⚽</div>
          <p>No hay jornadas registradas aún</p>
          <button className="btn-primary" onClick={onNewMatch}>Registrar primera jornada</button>
        </div>
      )}
    </div>
  )
}
