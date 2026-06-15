import { useState, useEffect, useMemo } from 'react'
import { PLAYERS, autoAssignTeams, getRanking } from '../utils/scoring'

const EMPTY_MATCH = (round) => ({
  round,
  team1: [],
  team2: [],
  goals1: '',
  goals2: '',
  mvp1: '',
  mvp2: '',
  keeper1: '',
  keeper2: '',
  completed: false,
  date: new Date().toISOString().split('T')[0]
})

export default function NewMatch({ stats, matches, editMatch, onSave, onCancel }) {
  const nextRound = (matches.length > 0 ? Math.max(...matches.map(m => m.round)) : 0) + 1
  const [form, setForm] = useState(editMatch || EMPTY_MATCH(nextRound))
  const [errors, setErrors] = useState({})
  const [teamMode, setTeamMode] = useState('auto') // 'auto' | 'manual'
  const [step, setStep] = useState(editMatch ? 2 : 1) // 1: equipos, 2: resultado

  const ranking = useMemo(() => stats ? getRanking(stats) : null, [stats])

  // Auto-asignar equipos al inicio
  useEffect(() => {
    if (!editMatch && stats && teamMode === 'auto') {
      const { team1, team2 } = autoAssignTeams(stats)
      setForm(prev => ({ ...prev, team1, team2 }))
    }
  }, [stats, teamMode, editMatch])

  function togglePlayer(player, teamNum) {
    setForm(prev => {
      const team = teamNum === 1 ? 'team1' : 'team2'
      const otherTeam = teamNum === 1 ? 'team2' : 'team1'
      if (prev[team].includes(player)) {
        return { ...prev, [team]: prev[team].filter(p => p !== player) }
      } else if (prev[otherTeam].includes(player)) {
        // Mover al otro equipo
        return {
          ...prev,
          [team]: [...prev[team], player],
          [otherTeam]: prev[otherTeam].filter(p => p !== player)
        }
      } else {
        return { ...prev, [team]: [...prev[team], player] }
      }
    })
  }

  function validate() {
    const errs = {}
    if (form.team1.length < 1) errs.team1 = 'El equipo 1 necesita al menos 1 jugador'
    if (form.team2.length < 1) errs.team2 = 'El equipo 2 necesita al menos 1 jugador'
    if (step === 2) {
      const g1 = parseInt(form.goals1)
      const g2 = parseInt(form.goals2)
      if (isNaN(g1) || g1 < 0) errs.goals1 = 'Ingresa goles válidos'
      if (isNaN(g2) || g2 < 0) errs.goals2 = 'Ingresa goles válidos'
      if (!isNaN(g1) && !isNaN(g2) && g1 === g2) errs.goals = 'No se permiten empates'
      if (!form.mvp1) errs.mvp1 = 'Selecciona MVP equipo 1'
      if (!form.mvp2) errs.mvp2 = 'Selecciona MVP equipo 2'
      if (!form.keeper1) errs.keeper1 = 'Selecciona arquero equipo 1'
      if (!form.keeper2) errs.keeper2 = 'Selecciona arquero equipo 2'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSaveTeams() {
    if (validate()) setStep(2)
  }

  function handleSaveMatch(completed) {
    if (!validate()) return
    const g1 = parseInt(form.goals1)
    const g2 = parseInt(form.goals2)
    onSave({ ...form, goals1: g1, goals2: g2, completed })
  }

  const isEditing = !!editMatch

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={onCancel}>← Volver</button>
        <h2>{isEditing ? `Editar Jornada ${form.round}` : `Nueva Jornada ${form.round}`}</h2>
      </div>

      {/* Step 1: Equipos */}
      {step === 1 && (
        <div className="form-section">
          <div className="form-row-tabs">
            <button
              className={`tab-btn ${teamMode === 'auto' ? 'active' : ''}`}
              onClick={() => setTeamMode('auto')}
            >Auto (recomendado)</button>
            <button
              className={`tab-btn ${teamMode === 'manual' ? 'active' : ''}`}
              onClick={() => setTeamMode('manual')}
            >Manual</button>
          </div>

          {teamMode === 'auto' && ranking && (
            <div className="auto-info">
              <p>🎯 Los dos últimos en tabla eligen primero:</p>
              <div className="last-players">
                {ranking.slice(-2).reverse().map((p, i) => (
                  <span key={p.name} className="captain-badge">
                    {i === 0 ? '1°' : '2°'} {p.name} ({p.pts} pts)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Team assignment display */}
          <div className="teams-builder">
            <div className="team-column">
              <div className="team-col-header team1-header">Equipo 1</div>
              <div className="team-players-list">
                {form.team1.map(p => (
                  <div key={p} className="player-chip chip-team1">
                    {p}
                    {teamMode === 'manual' && (
                      <button onClick={() => togglePlayer(p, 1)} className="chip-remove">×</button>
                    )}
                  </div>
                ))}
                {form.team1.length === 0 && <div className="empty-team">Sin jugadores</div>}
              </div>
            </div>
            <div className="team-column">
              <div className="team-col-header team2-header">Equipo 2</div>
              <div className="team-players-list">
                {form.team2.map(p => (
                  <div key={p} className="player-chip chip-team2">
                    {p}
                    {teamMode === 'manual' && (
                      <button onClick={() => togglePlayer(p, 2)} className="chip-remove">×</button>
                    )}
                  </div>
                ))}
                {form.team2.length === 0 && <div className="empty-team">Sin jugadores</div>}
              </div>
            </div>
          </div>

          {teamMode === 'manual' && (
            <div className="player-picker">
              <div className="picker-label">Toca un jugador para asignarlo / moverlo:</div>
              <div className="picker-grid">
                {PLAYERS.map(p => {
                  const inTeam1 = form.team1.includes(p)
                  const inTeam2 = form.team2.includes(p)
                  return (
                    <button
                      key={p}
                      className={`picker-btn ${inTeam1 ? 'in-team1' : ''} ${inTeam2 ? 'in-team2' : ''}`}
                      onClick={() => {
                        if (!inTeam1 && !inTeam2) togglePlayer(p, 1)
                        else if (inTeam1) togglePlayer(p, 2)
                        else togglePlayer(p, 1)
                      }}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {errors.team1 && <p className="error">{errors.team1}</p>}
          {errors.team2 && <p className="error">{errors.team2}</p>}

          <div className="form-actions">
            <button className="btn-primary full-width" onClick={handleSaveTeams}>
              Continuar → Ingresar Resultado
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Resultado */}
      {step === 2 && (
        <div className="form-section">
          <button className="btn-back-step" onClick={() => setStep(1)}>← Cambiar equipos</button>

          {/* Score input */}
          <div className="score-input-section">
            <div className="score-team">
              <div className="score-team-label">Equipo 1</div>
              <div className="score-team-players">{form.team1.join(', ')}</div>
              <input
                type="number"
                min="0"
                className={`score-input ${errors.goals1 ? 'input-error' : ''}`}
                value={form.goals1}
                onChange={e => setForm(p => ({ ...p, goals1: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="score-vs">VS</div>
            <div className="score-team">
              <div className="score-team-label">Equipo 2</div>
              <div className="score-team-players">{form.team2.join(', ')}</div>
              <input
                type="number"
                min="0"
                className={`score-input ${errors.goals2 ? 'input-error' : ''}`}
                value={form.goals2}
                onChange={e => setForm(p => ({ ...p, goals2: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          {errors.goals && <p className="error center">{errors.goals}</p>}

          {/* Date */}
          <div className="form-field">
            <label>Fecha del partido</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="field-input"
            />
          </div>

          {/* MVP Team 1 */}
          <div className="form-field">
            <label>⭐ MVP Equipo 1</label>
            <div className={`player-select-grid ${errors.mvp1 ? 'grid-error' : ''}`}>
              {form.team1.map(p => (
                <button
                  key={p}
                  className={`select-btn ${form.mvp1 === p ? 'selected' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, mvp1: prev.mvp1 === p ? '' : p }))}
                >{p}</button>
              ))}
            </div>
            {errors.mvp1 && <p className="error">{errors.mvp1}</p>}
          </div>

          {/* MVP Team 2 */}
          <div className="form-field">
            <label>⭐ MVP Equipo 2</label>
            <div className={`player-select-grid ${errors.mvp2 ? 'grid-error' : ''}`}>
              {form.team2.map(p => (
                <button
                  key={p}
                  className={`select-btn ${form.mvp2 === p ? 'selected' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, mvp2: prev.mvp2 === p ? '' : p }))}
                >{p}</button>
              ))}
            </div>
            {errors.mvp2 && <p className="error">{errors.mvp2}</p>}
          </div>

          {/* Keeper Team 1 */}
          <div className="form-field">
            <label>🧤 Arquero Equipo 1</label>
            <div className={`player-select-grid ${errors.keeper1 ? 'grid-error' : ''}`}>
              {form.team1.map(p => (
                <button
                  key={p}
                  className={`select-btn ${form.keeper1 === p ? 'selected' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, keeper1: prev.keeper1 === p ? '' : p }))}
                >{p}</button>
              ))}
            </div>
            {errors.keeper1 && <p className="error">{errors.keeper1}</p>}
          </div>

          {/* Keeper Team 2 */}
          <div className="form-field">
            <label>🧤 Arquero Equipo 2</label>
            <div className={`player-select-grid ${errors.keeper2 ? 'grid-error' : ''}`}>
              {form.team2.map(p => (
                <button
                  key={p}
                  className={`select-btn ${form.keeper2 === p ? 'selected' : ''}`}
                  onClick={() => setForm(prev => ({ ...prev, keeper2: prev.keeper2 === p ? '' : p }))}
                >{p}</button>
              ))}
            </div>
            {errors.keeper2 && <p className="error">{errors.keeper2}</p>}
          </div>

          <div className="form-actions">
            <button className="btn-primary full-width" onClick={() => handleSaveMatch(true)}>
              ✓ Guardar Resultado
            </button>
            <button className="btn-secondary full-width" onClick={() => handleSaveMatch(false)}>
              Guardar sin resultado (pendiente)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
