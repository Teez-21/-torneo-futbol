import { calculateMatchPoints } from '../utils/scoring'

function MatchCard({ match, onEdit, onView }) {
  const pts = match.completed ? calculateMatchPoints(match) : {}
  const winner = match.completed
    ? (match.goals1 > match.goals2 ? match.team1 : match.team2)
    : null

  return (
    <div className="match-card" onClick={() => onView(match)}>
      <div className="match-card-header">
        <span className="match-round">Jornada {match.round}</span>
        <span className={`match-status ${match.completed ? 'status-done' : 'status-pending'}`}>
          {match.completed ? '✓ Completado' : '○ Pendiente'}
        </span>
      </div>

      {match.completed ? (
        <>
          <div className="match-score-row">
            <div className={`match-team ${winner === match.team1 ? 'team-winner' : 'team-loser'}`}>
              <div className="team-players">{match.team1.join(', ')}</div>
            </div>
            <div className="match-score">
              <span className={winner === match.team1 ? 'score-win' : 'score-lose'}>{match.goals1}</span>
              <span className="score-sep">-</span>
              <span className={winner === match.team2 ? 'score-win' : 'score-lose'}>{match.goals2}</span>
            </div>
            <div className={`match-team team-right ${winner === match.team2 ? 'team-winner' : 'team-loser'}`}>
              <div className="team-players">{match.team2.join(', ')}</div>
            </div>
          </div>
          <div className="match-details-row">
            {match.mvp1 && <span className="detail-tag">⭐ MVP: {match.goals1 > match.goals2 ? match.mvp1 : match.mvp2}</span>}
          </div>
        </>
      ) : (
        <div className="match-pending-info">
          <p>Equipos asignados — resultado pendiente</p>
        </div>
      )}

      <button
        className="btn-edit-match"
        onClick={e => { e.stopPropagation(); onEdit(match) }}
        title="Editar"
      >
        ✏️
      </button>
    </div>
  )
}

export default function Matches({ matches, stats, onEdit, onView, onNew }) {
  const sorted = [...matches].sort((a, b) => b.round - a.round)

  return (
    <div className="page">
      <div className="page-header">
        <h2>Jornadas</h2>
        <button className="btn-primary-sm" onClick={onNew}>+ Nueva</button>
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No hay jornadas registradas</p>
          <button className="btn-primary" onClick={onNew}>Registrar primera jornada</button>
        </div>
      ) : (
        <div className="match-list">
          {sorted.map(match => (
            <MatchCard key={match.id} match={match} onEdit={onEdit} onView={onView} />
          ))}
        </div>
      )}
    </div>
  )
}
