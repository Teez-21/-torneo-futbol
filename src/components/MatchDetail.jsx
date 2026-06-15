import { calculateMatchPoints } from '../utils/scoring'

export default function MatchDetail({ match, onEdit, onDelete, onBack }) {
  const pts = match.completed ? calculateMatchPoints(match) : {}
  const winner = match.completed
    ? (match.goals1 > match.goals2 ? match.team1 : match.team2)
    : null
  const loser = match.completed
    ? (match.goals1 > match.goals2 ? match.team2 : match.team1)
    : null

  const winnerMVP = match.completed
    ? (match.goals1 > match.goals2 ? match.mvp1 : match.mvp2)
    : null
  const loserMVP = match.completed
    ? (match.goals1 > match.goals2 ? match.mvp2 : match.mvp1)
    : null
  const winnerKeeper = match.completed
    ? (match.goals1 > match.goals2 ? match.keeper1 : match.keeper2)
    : null
  const loserKeeper = match.completed
    ? (match.goals1 > match.goals2 ? match.keeper2 : match.keeper1)
    : null
  const goalsVsWinnerKeeper = match.completed
    ? (match.goals1 > match.goals2 ? match.goals2 : match.goals1)
    : null
  const goalsVsLoserKeeper = match.completed
    ? (match.goals1 > match.goals2 ? match.goals1 : match.goals2)
    : null

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={onBack}>← Volver</button>
        <h2>Jornada {match.round}</h2>
        <button className="btn-edit-icon" onClick={onEdit} title="Editar">✏️</button>
      </div>

      {match.date && (
        <div className="detail-date">📅 {new Date(match.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      )}

      {match.completed ? (
        <>
          {/* Scoreboard */}
          <div className="detail-scoreboard">
            <div className={`sb-team ${winner === match.team1 ? 'sb-winner' : 'sb-loser'}`}>
              <div className="sb-label">{winner === match.team1 ? '🏆 Ganadores' : '❌ Perdedores'}</div>
              <div className="sb-players">{match.team1.join(', ')}</div>
              <div className="sb-score">{match.goals1}</div>
            </div>
            <div className="sb-vs">VS</div>
            <div className={`sb-team ${winner === match.team2 ? 'sb-winner' : 'sb-loser'}`}>
              <div className="sb-label">{winner === match.team2 ? '🏆 Ganadores' : '❌ Perdedores'}</div>
              <div className="sb-players">{match.team2.join(', ')}</div>
              <div className="sb-score">{match.goals2}</div>
            </div>
          </div>

          {/* Special awards */}
          <div className="detail-awards">
            <div className="awards-title">Reconocimientos</div>
            <div className="award-item award-gold">
              <span>⭐ MVP Equipo 1</span>
              <span className="award-name">{match.mvp1}</span>
              <span className="award-pts">+1 pt</span>
            </div>
            <div className="award-item award-gold">
              <span>⭐ MVP Equipo 2</span>
              <span className="award-name">{match.mvp2}</span>
              <span className="award-pts">+1 pt</span>
            </div>
            <div className={`award-item ${match.goals2 < 3 ? 'award-gold' : 'award-dim'}`}>
              <span>🧤 Arquero Equipo 1</span>
              <span className="award-name">{match.keeper1}</span>
              <span className="award-pts">
                {match.goals2 < 3 ? '+2 pts' : `${match.goals2} goles recibidos`}
              </span>
            </div>
            <div className={`award-item ${match.goals1 < 3 ? 'award-gold' : 'award-dim'}`}>
              <span>🧤 Arquero Equipo 2</span>
              <span className="award-name">{match.keeper2}</span>
              <span className="award-pts">
                {match.goals1 < 3 ? '+2 pts' : `${match.goals1} goles recibidos`}
              </span>
            </div>
          </div>

          {/* Points breakdown */}
          <div className="detail-points">
            <div className="points-title">Puntos ganados en esta jornada</div>
            {[...match.team1, ...match.team2]
              .sort((a, b) => (pts[b] || 0) - (pts[a] || 0))
              .map(player => (
                <div key={player} className={`points-row ${(pts[player] || 0) > 0 ? 'pts-positive' : ''}`}>
                  <span className="pts-player">{player}</span>
                  <span className="pts-value">+{pts[player] || 0}</span>
                </div>
              ))}
          </div>
        </>
      ) : (
        <div className="detail-pending">
          <div className="pending-teams">
            <div className="pending-team">
              <div className="pending-label">Equipo 1</div>
              {match.team1.map(p => <div key={p} className="pending-player">{p}</div>)}
            </div>
            <div className="pending-team">
              <div className="pending-label">Equipo 2</div>
              {match.team2.map(p => <div key={p} className="pending-player">{p}</div>)}
            </div>
          </div>
          <p className="pending-msg">⏳ Resultado pendiente</p>
          <button className="btn-primary" onClick={onEdit}>Ingresar resultado</button>
        </div>
      )}

      {/* Delete */}
      <div className="detail-footer">
        {showDeleteConfirm ? (
          <div className="delete-confirm">
            <p>¿Eliminar esta jornada?</p>
            <div className="delete-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              <button className="btn-danger" onClick={onDelete}>Eliminar</button>
            </div>
          </div>
        ) : (
          <button className="btn-danger-outline" onClick={() => setShowDeleteConfirm(true)}>
            🗑 Eliminar jornada
          </button>
        )}
      </div>
    </div>
  )
}

// Need useState
import { useState } from 'react'
