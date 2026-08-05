import { useState, useMemo } from 'react'
import { useTournamentStorage } from './hooks/useStorage'
import { recalculateAllStats } from './utils/scoring'
import Standings from './components/Standings'
import Matches from './components/Matches'
import NewMatch from './components/NewMatch'
import MatchDetail from './components/MatchDetail'
import './styles/app.css'

const ACCESS_CODE = '070320'

function formatSaved(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const { data, loading, updateMatches, resetTournament, lastSaved } = useTournamentStorage()
  const [view, setView]           = useState('standings')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showReset, setShowReset] = useState(false)
  const [resetStep, setResetStep] = useState('auth')
  const [resetCode, setResetCode] = useState('')
  const [resetCodeError, setResetCodeError] = useState(false)

  const stats = useMemo(() => {
    if (!data?.matches) return null
    return recalculateAllStats(data.matches)
  }, [data?.matches])

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-ball">⚽</div>
      <p>Cargando torneo...</p>
    </div>
  )

  const matches = data?.matches || []

  function handleSaveMatch(matchData) {
    const newMatches = matchData.id && matches.find(m => m.id === matchData.id)
      ? matches.map(m => m.id === matchData.id ? matchData : m)
      : [...matches, { ...matchData, id: Date.now().toString() }]
    updateMatches(newMatches)
    setView('matches')
    setSelectedMatch(null)
  }

  function openResetModal() {
    setResetStep('auth'); setResetCode(''); setResetCodeError(false); setShowReset(true)
  }

  function handleResetAuth() {
    if (resetCode === ACCESS_CODE) { setResetStep('confirm'); setResetCodeError(false) }
    else { setResetCodeError(true); setResetCode('') }
  }

  function handleReset() {
    resetTournament(); setShowReset(false); setResetCode(''); setView('standings')
  }

  function closeReset() {
    setShowReset(false); setResetCode(''); setResetCodeError(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div>
            <h1 className="header-title">La Banca Llena League ⚽</h1>
            <div className="header-bottom-row">
              <p className="header-sub">{matches.filter(m => m.completed).length} jornadas jugadas</p>
              {lastSaved && <span className="save-indicator">✓ Guardado {formatSaved(lastSaved)}</span>}
            </div>
          </div>
        </div>
        <button className="btn-reset" onClick={openResetModal} title="Reiniciar torneo">⚙</button>
      </header>

      <main className="app-main">
        {view === 'standings' && (
          <Standings stats={stats} matches={matches}
            onNewMatch={() => { setSelectedMatch(null); setView('new-match') }} />
        )}
        {view === 'matches' && (
          <Matches matches={matches}
            onEdit={m => { setSelectedMatch(m); setView('new-match') }}
            onView={m => { setSelectedMatch(m); setView('match-detail') }}
            onNew={() => { setSelectedMatch(null); setView('new-match') }}
          />
        )}
        {view === 'new-match' && (
          <NewMatch stats={stats} matches={matches} editMatch={selectedMatch}
            onSave={handleSaveMatch}
            onCancel={() => { setView(selectedMatch ? 'matches' : 'standings'); setSelectedMatch(null) }}
          />
        )}
        {view === 'match-detail' && selectedMatch && (
          <MatchDetail match={selectedMatch}
            onEdit={() => { setView('new-match') }}
            onDelete={() => {
              updateMatches(matches.filter(m => m.id !== selectedMatch.id))
              setView('matches'); setSelectedMatch(null)
            }}
            onBack={() => { setView('matches'); setSelectedMatch(null) }}
          />
        )}
      </main>

      {(view === 'standings' || view === 'matches') && (
        <nav className="bottom-nav">
          <button className={`nav-item ${view==='standings'?'active':''}`} onClick={() => setView('standings')}>
            <span className="nav-icon">🏆</span><span>Tabla</span>
          </button>
          <button className="nav-fab" onClick={() => { setSelectedMatch(null); setView('new-match') }}>
            <span>+</span>
          </button>
          <button className={`nav-item ${view==='matches'?'active':''}`} onClick={() => setView('matches')}>
            <span className="nav-icon">📋</span><span>Jornadas</span>
          </button>
        </nav>
      )}

      {showReset && (
        <div className="modal-overlay" onClick={closeReset}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {resetStep === 'auth' && (
              <>
                <h2>⚙️ Reiniciar Liga</h2>
                <p>Ingresa la clave para continuar</p>
                <input type="password"
                  className={`auth-input modal-code-input ${resetCodeError?'input-error':''}`}
                  value={resetCode}
                  onChange={e => { setResetCode(e.target.value); setResetCodeError(false) }}
                  onKeyDown={e => e.key==='Enter' && handleResetAuth()}
                  placeholder="• • • • • •" maxLength={10} autoFocus
                />
                {resetCodeError && <p className="error center" style={{marginTop:'8px'}}>Clave incorrecta</p>}
                <div className="modal-actions" style={{marginTop:'20px'}}>
                  <button className="btn-secondary" onClick={closeReset}>Cancelar</button>
                  <button className="btn-primary" onClick={handleResetAuth}>Continuar</button>
                </div>
              </>
            )}
            {resetStep === 'confirm' && (
              <>
                <h2>⚠️ ¿Reiniciar liga?</h2>
                <p>Se borrarán <strong>todos</strong> los resultados. Esta acción no se puede deshacer.</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={closeReset}>Cancelar</button>
                  <button className="btn-danger" onClick={handleReset}>Sí, reiniciar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
