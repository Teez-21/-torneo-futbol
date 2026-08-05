import { useState, useEffect, useMemo } from 'react'
import { PLAYERS, EXTRA_PLAYER_NAME, autoAssignTeams, randomShuffleTeams, getRanking } from '../utils/scoring'

const ACCESS_CODE = '070320'

const EMPTY_MATCH = (round) => ({
  round, team1: [], team2: [],
  goals1: '', goals2: '', mvp1: '', mvp2: '', keeper1: '', keeper2: '',
  hasExtraPlayer: false, extraInTeam: null,
  completed: false, date: new Date().toISOString().split('T')[0]
})

export default function NewMatch({ stats, matches, editMatch, onSave, onCancel }) {
  const nextRound = (matches.length > 0 ? Math.max(...matches.map(m => m.round)) : 0) + 1
  const [form, setForm]           = useState(editMatch || EMPTY_MATCH(nextRound))
  const [errors, setErrors]       = useState({})
  const [teamMode, setTeamMode]   = useState('auto')
  const [step, setStep]           = useState('auth')
  const [authenticated, setAuthenticated] = useState(false)
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState(false)

  const ranking = useMemo(() => stats ? getRanking(stats) : null, [stats])

  useEffect(() => {
    if (!editMatch && stats && authenticated && teamMode === 'auto') {
      const { team1, team2, shortTeam } = autoAssignTeams(stats)
      setForm(prev => ({ ...prev, team1, team2, hasExtraPlayer: false, extraInTeam: shortTeam }))
    }
  }, [stats, authenticated, teamMode, editMatch])

  function handleAuth() {
    if (codeInput === ACCESS_CODE) { setAuthenticated(true); setCodeError(false); setStep('teams') }
    else { setCodeError(true); setCodeInput('') }
  }

  function handleShuffle() {
    const { team1, team2, shortTeam } = randomShuffleTeams()
    setForm(prev => ({ ...prev, team1, team2, hasExtraPlayer: false, extraInTeam: shortTeam }))
  }

  function toggleExtraPlayer(teamNum) {
    setForm(prev => ({
      ...prev,
      hasExtraPlayer: prev.extraInTeam === teamNum ? !prev.hasExtraPlayer : true,
      extraInTeam: teamNum
    }))
  }

  function togglePlayer(player, teamNum) {
    setForm(prev => {
      const t = teamNum === 1 ? 'team1' : 'team2'
      const o = teamNum === 1 ? 'team2' : 'team1'
      if (prev[t].includes(player)) return { ...prev, [t]: prev[t].filter(p => p !== player) }
      if (prev[o].includes(player)) return { ...prev, [t]: [...prev[t], player], [o]: prev[o].filter(p => p !== player) }
      return { ...prev, [t]: [...prev[t], player] }
    })
  }

  const validTeam1 = form.team1.filter(p => PLAYERS.includes(p))
  const validTeam2 = form.team2.filter(p => PLAYERS.includes(p))

  function validate() {
    const errs = {}
    if (form.team1.length < 1) errs.team1 = 'El equipo 1 necesita jugadores'
    if (form.team2.length < 1) errs.team2 = 'El equipo 2 necesita jugadores'
    if (step === 'result') {
      const g1 = parseInt(form.goals1), g2 = parseInt(form.goals2)
      if (isNaN(g1) || g1 < 0) errs.goals1 = 'Goles inválidos'
      if (isNaN(g2) || g2 < 0) errs.goals2 = 'Goles inválidos'
      if (!isNaN(g1) && !isNaN(g2) && g1 === g2) errs.goals = 'No se permiten empates'
      if (!form.mvp1)    errs.mvp1    = 'Selecciona MVP equipo 1'
      if (!form.mvp2)    errs.mvp2    = 'Selecciona MVP equipo 2'
      if (!form.keeper1) errs.keeper1 = 'Selecciona arquero equipo 1'
      if (!form.keeper2) errs.keeper2 = 'Selecciona arquero equipo 2'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSaveMatch(completed) {
    if (!validate()) return
    onSave({ ...form, goals1: parseInt(form.goals1), goals2: parseInt(form.goals2), completed })
  }

  // ── AUTH ──────────────────────────────────────────────
  if (!authenticated) return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={onCancel}>← Volver</button>
        <h2>{editMatch ? `Editar Jornada ${form.round}` : `Nueva Jornada ${form.round}`}</h2>
      </div>
      <div className="auth-container">
        <div className="auth-icon">🔐</div>
        <h3 className="auth-title">Clave de acceso</h3>
        <p className="auth-desc">Ingresa la clave para gestionar resultados</p>
        <input type="password"
          className={`auth-input ${codeError ? 'input-error' : ''}`}
          value={codeInput}
          onChange={e => { setCodeInput(e.target.value); setCodeError(false) }}
          onKeyDown={e => e.key === 'Enter' && handleAuth()}
          placeholder="• • • • • •" maxLength={10} autoFocus
        />
        {codeError && <p className="error center" style={{marginTop:'8px'}}>Clave incorrecta</p>}
        <button className="btn-primary full-width" style={{marginTop:'16px'}} onClick={handleAuth}>Entrar</button>
      </div>
    </div>
  )

  // ── EQUIPOS ───────────────────────────────────────────
  if (step === 'teams') return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={onCancel}>← Volver</button>
        <h2>{editMatch ? `Editar Jornada ${form.round}` : `Nueva Jornada ${form.round}`}</h2>
      </div>
      <div className="form-section">
        <div className="form-row-tabs">
          <button className={`tab-btn ${teamMode==='auto'?'active':''}`} onClick={() => setTeamMode('auto')}>🎯 Por tabla</button>
          <button className={`tab-btn ${teamMode==='random'?'active':''}`} onClick={() => { setTeamMode('random'); handleShuffle() }}>🎲 Aleatorio</button>
          <button className={`tab-btn ${teamMode==='manual'?'active':''}`} onClick={() => setTeamMode('manual')}>✏️ Manual</button>
        </div>

        {teamMode === 'auto' && ranking && (
          <div className="auto-info">
            <p>🎯 Los dos últimos en tabla eligen primero:</p>
            <div className="last-players">
              {ranking.slice(-2).reverse().map((p, i) => (
                <span key={p.name} className="captain-badge">{i===0?'1°':'2°'} {p.name} ({p.pts} pts)</span>
              ))}
            </div>
          </div>
        )}
        {teamMode === 'random' && (
          <div className="auto-info">
            <p>🎲 Equipos sorteados al azar.</p>
            <button className="btn-shuffle" onClick={handleShuffle}>🔀 Sortear de nuevo</button>
          </div>
        )}

        <div className="extra-info-box">
          <p>⚡ El equipo de 4 puede agregar un <strong>Extra Player</strong> para completar 5v5. No suma puntos ni aparece en la tabla.</p>
        </div>

        <div className="teams-builder">
          {[1, 2].map(teamNum => {
            const players = teamNum === 1 ? form.team1 : form.team2
            const showExtra = form.extraInTeam === teamNum && form.hasExtraPlayer
            return (
              <div className="team-column" key={teamNum}>
                <div className={`team-col-header ${teamNum===1?'team1-header':'team2-header'}`}>
                  Equipo {teamNum} ({players.length}{showExtra?'+1⚡':''})
                </div>
                <div className="team-players-list">
                  {players.map(p => (
                    <div key={p} className="player-chip chip-team1" style={teamNum===2?{background:'rgba(59,130,246,0.1)',color:'#60a5fa'}:{}}>
                      {p}
                      {teamMode === 'manual' && <button onClick={() => togglePlayer(p, teamNum)} className="chip-remove">×</button>}
                    </div>
                  ))}
                  {showExtra && (
                    <div className="player-chip chip-extra">
                      {EXTRA_PLAYER_NAME} ⚡
                      <button onClick={() => toggleExtraPlayer(teamNum)} className="chip-remove">×</button>
                    </div>
                  )}
                  {players.length === 0 && <div className="empty-team">Sin jugadores</div>}
                </div>
                {!showExtra && players.length === 4 && (
                  <button className="btn-add-extra" onClick={() => toggleExtraPlayer(teamNum)}>+ Extra Player ⚡</button>
                )}
              </div>
            )
          })}
        </div>

        {teamMode === 'manual' && (
          <div className="player-picker">
            <div className="picker-label">Toca para asignar / mover jugadores:</div>
            <div className="picker-grid">
              {PLAYERS.map(p => {
                const in1 = form.team1.includes(p), in2 = form.team2.includes(p)
                return (
                  <button key={p}
                    className={`picker-btn ${in1?'in-team1':''} ${in2?'in-team2':''}`}
                    onClick={() => {
                      if (!in1 && !in2) togglePlayer(p, 1)
                      else if (in1) togglePlayer(p, 2)
                      else togglePlayer(p, 1)
                    }}
                  >{p}</button>
                )
              })}
            </div>
          </div>
        )}

        {errors.team1 && <p className="error">{errors.team1}</p>}
        {errors.team2 && <p className="error">{errors.team2}</p>}
        <div className="form-actions">
          <button className="btn-primary full-width" onClick={() => { if(validate()) setStep('result') }}>
            Continuar → Ingresar Resultado
          </button>
        </div>
      </div>
    </div>
  )

  // ── RESULTADO ─────────────────────────────────────────
  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={onCancel}>← Volver</button>
        <h2>{editMatch ? `Editar Jornada ${form.round}` : `Nueva Jornada ${form.round}`}</h2>
      </div>
      <div className="form-section">
        <button className="btn-back-step" onClick={() => setStep('teams')}>← Cambiar equipos</button>
        {form.hasExtraPlayer && (
          <div className="extra-player-note">⚡ Extra Player en Equipo {form.extraInTeam} — no suma puntos</div>
        )}

        <div className="score-input-section">
          {[1,2].map(n => (
            <div className="score-team" key={n}>
              <div className="score-team-label">Equipo {n}</div>
              <div className="score-team-players">
                {(n===1?form.team1:form.team2).join(', ')}
                {form.hasExtraPlayer && form.extraInTeam === n && <span className="extra-tag"> +⚡</span>}
              </div>
              <input type="number" min="0"
                className={`score-input ${errors[`goals${n}`]?'input-error':''}`}
                value={n===1?form.goals1:form.goals2}
                onChange={e => setForm(p => ({ ...p, [`goals${n}`]: e.target.value }))}
                placeholder="0"
              />
            </div>
          ))}
          <div className="score-vs">VS</div>
        </div>
        {errors.goals && <p className="error center">{errors.goals}</p>}

        <div className="form-field">
          <label>Fecha del partido</label>
          <input type="date" value={form.date}
            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            className="field-input"
          />
        </div>

        {[{label:'⭐ MVP Equipo 1', key:'mvp1', players:validTeam1},
          {label:'⭐ MVP Equipo 2', key:'mvp2', players:validTeam2},
          {label:'🧤 Arquero Equipo 1', key:'keeper1', players:validTeam1},
          {label:'🧤 Arquero Equipo 2', key:'keeper2', players:validTeam2}
        ].map(({label, key, players}) => (
          <div className="form-field" key={key}>
            <label>{label}</label>
            <div className={`player-select-grid ${errors[key]?'grid-error':''}`}>
              {players.map(p => (
                <button key={p}
                  className={`select-btn ${form[key]===p?'selected':''}`}
                  onClick={() => setForm(prev => ({ ...prev, [key]: prev[key]===p?'':p }))}
                >{p}</button>
              ))}
            </div>
            {errors[key] && <p className="error">{errors[key]}</p>}
          </div>
        ))}

        <div className="form-actions">
          <button className="btn-primary full-width" onClick={() => handleSaveMatch(true)}>✓ Guardar Resultado</button>
          <button className="btn-secondary full-width" onClick={() => handleSaveMatch(false)}>Guardar sin resultado (pendiente)</button>
        </div>
      </div>
    </div>
  )
}
