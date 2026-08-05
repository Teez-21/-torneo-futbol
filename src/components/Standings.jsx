import { useState } from 'react'
import { getRanking, getAltRanking } from '../utils/scoring'

export default function Standings({ stats, matches, onNewMatch }) {
  const [activeTab, setActiveTab] = useState('main') // 'main' | 'alt'
  if (!stats) return null

  const ranking    = getRanking(stats)
  const altRanking = getAltRanking(stats)
  const completed  = matches.filter(m => m.completed)

  return (
    <div className="page">
      {/* Summary cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-value">{completed.length}</span>
          <span className="summary-label">Jornadas</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{ranking[0]?.pts ?? 0}</span>
          <span className="summary-label">Líder pts</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{ranking[0]?.name?.split(' ')[0] ?? '—'}</span>
          <span className="summary-label">Líder</span>
        </div>
      </div>

      {/* Podium top 3 */}
      {completed.length > 0 && (
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

      {/* Tab switcher */}
      <div className="table-tabs">
        <button
          className={`table-tab ${activeTab === 'main' ? 'active' : ''}`}
          onClick={() => setActiveTab('main')}
        >
          🏆 Tabla principal
        </button>
        <button
          className={`table-tab ${activeTab === 'alt' ? 'active' : ''}`}
          onClick={() => setActiveTab('alt')}
        >
          ⚖️ Tabla alterna
        </button>
      </div>

      {/* TABLA PRINCIPAL */}
      {activeTab === 'main' && (
        <>
          <div className="table-description">
            Puntos por ganar (+1), MVP (+1) y arquero con &lt;3 goles (+2)
          </div>
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
              const isTop    = idx === 0 && completed.length > 0
              const isBottom = idx >= ranking.length - 2 && completed.length > 0
              return (
                <div key={player.name}
                  className={`ranking-row ${isTop ? 'row-top' : ''} ${isBottom ? 'row-bottom' : ''}`}
                >
                  <span className="col-pos">
                    {isTop ? '👑' : isBottom ? '⬇' : idx + 1}
                  </span>
                  <span className="col-name">
                    {player.name}
                    {player.mvpCount > 0 && (
                      <span className="mvp-badge">⭐{player.mvpCount}</span>
                    )}
                    {player.keeperBonusCount > 0 && (
                      <span className="keeper-badge">🧤{player.keeperBonusCount}</span>
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

          <div className="legend">
            <div className="legend-title">Sistema de puntos</div>
            <div className="legend-item"><span className="legend-dot green"/>Ganar partido: +1 pt</div>
            <div className="legend-item"><span className="legend-dot green"/>MVP (cualquier equipo): +1 pt</div>
            <div className="legend-item"><span className="legend-dot green"/>Arquero con &lt;3 goles recibidos: +2 pts</div>
          </div>
        </>
      )}

      {/* TABLA ALTERNA */}
      {activeTab === 'alt' && (
        <>
          <div className="table-description alt-desc">
            Solo victorias. MVP ⭐ y arquero 🧤 aparecen como referencia pero <strong>no suman puntos</strong> aquí. Úsala como criterio de desempate.
          </div>
          <div className="ranking-table">
            <div className="ranking-header">
              <span className="col-pos">#</span>
              <span className="col-name">Jugador</span>
              <span className="col-stat">V</span>
              <span className="col-stat">MVP</span>
              <span className="col-stat">🧤</span>
              <span className="col-stat highlight">Pts</span>
            </div>
            {altRanking.map((player, idx) => {
              const isTop    = idx === 0 && completed.length > 0
              const isBottom = idx >= altRanking.length - 2 && completed.length > 0
              return (
                <div key={player.name}
                  className={`ranking-row ${isTop ? 'row-top' : ''} ${isBottom ? 'row-bottom' : ''}`}
                >
                  <span className="col-pos">
                    {isTop ? '👑' : isBottom ? '⬇' : idx + 1}
                  </span>
                  <span className="col-name">{player.name}</span>
                  <span className="col-stat">{player.wins}</span>
                  <span className="col-stat alt-info">
                    {player.mvpCount > 0 ? `⭐${player.mvpCount}` : '—'}
                  </span>
                  <span className="col-stat alt-info">
                    {player.keeperBonusCount > 0 ? `🧤${player.keeperBonusCount}` : '—'}
                  </span>
                  <span className="col-stat highlight">{player.altPts}</span>
                </div>
              )
            })}
          </div>

          <div className="legend">
            <div className="legend-title">Cómo funciona esta tabla</div>
            <div className="legend-item"><span className="legend-dot green"/>Ganar partido: +1 pt</div>
            <div className="legend-item"><span className="legend-dot dim"/>MVP ⭐: visible pero no suma</div>
            <div className="legend-item"><span className="legend-dot dim"/>Arquero 🧤: visible pero no suma</div>
          </div>
        </>
      )}

      {completed.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">⚽</div>
          <p>No hay jornadas registradas aún</p>
          <button className="btn-primary" onClick={onNewMatch}>Registrar primera jornada</button>
        </div>
      )}
    </div>
  )
}
