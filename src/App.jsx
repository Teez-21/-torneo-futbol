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
  const d = new Date(iso)
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const { data, loading, updateMatches, resetTournament, lastSaved } = useTournamentStorage()
  const [view, setView] = useState('standings')
  const [selectedMatch, setSelectedMatch] = useState(null)

  // Reset modal con clave
  const [showReset, setShowReset] = useState(false)
  const [resetStep, setResetStep] = useState('auth') // 'auth' | 'confirm'
  const [resetCode, setResetCode] = useState('')
  const [resetCodeError, setResetCodeError] = useState(false)

  const stats = useMemo(() => {
    if (!data?.matches) return null
    return recalculateAllStats(data.matches)
  }, [data?.matches])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-ball">⚽</div>
        <p>Cargando torneo...</p>
      </div>
    )
  }

  const matches = data?.matches || []

  function handleSaveMatch(matchData) {
    let newMatches
    if (matchData.id && matches.find(m => m.id === matchData.id)) {
      newMatches = matches.map(m => m.id === matchData.id ? matchData : m)
    } else {
      newMatches = [...matches, { ...matchData, id: Date.now().toString() }]
    }
    updateMatches(newMatches)
    setView('matches')
    setSelectedMatch(null)
  }

  function handleEditMatch(match) {
    setSelectedMatch(match)
    setView('new-match')
  }

  function handleDeleteMatch(matchId) {
    const newMatches = matches.filter(m => m.id !== matchId)
    updateMatches(newMatches)
    setView('matches')
    setSelectedMatch(null)
  }

  function handleViewMatch(match) {
    setSelectedMatch(match)
    setView('match-detail')
  }

  function openResetModal() {
    setResetStep('auth')
    setResetCode('')
    setResetCodeError(false)
    setShowReset(true)
  }

  function handleResetAuth() {
    if (resetCode === ACCESS_CODE) {
      setResetStep('confirm')
      setResetCodeError(false)
    } else {
      setResetCodeError(true)
      setResetCode('')
    }
  }

  function handleReset() {
    resetTournament()
    setShowReset(false)
    setResetCode('')
    setView('standings')
  }

  function closeResetModal() {
    setShowReset(false)
    setResetCode('')
    setResetCodeError(false)
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div>
            <h1 className="header-title">La Banca Llena League ⚽</h1>
            <div className="header-bottom-row">
              <p className="header-sub">{matches.filter(m => m.completed).length} jornadas jugadas</p>
              {lastSaved && (
                <span className="save-indicator">
                  ✓ Guardado {formatSaved(lastSaved)}
                </span>
              )}
            </div>
          </div>
        </div>
        <button className="btn-reset" onClick={openResetModal} title="Reiniciar torneo">⚙</button>
      </header>

      {/* Main content */}
      <main className="app-main">
        {view === 'standings' && (
          <Standings stats={stats} matches={matches} onNewMatch={() => { setSelectedMatch(null); setView('new-match') }} />
        )}
        {view === 'matches' && (
          <Matches
            matches={matches}
            stats={stats}
            onEdit={handleEditMatch}
            onView={handleViewMatch}
            onNew={() => { setSelectedMatch(null); setView('new-match') }}
          />
        )}
        {view === 'new-match' && (
          <NewMatch
            stats={stats}
            matches={matches}
            editMatch={selectedMatch}
            onSave={handleSaveMatch}
            onCancel={() => { setView(selectedMatch ? 'matches' : 'standings'); setSelectedMatch(null) }}
          />
        )}
        {view === 'match-detail' && selectedMatch && (
          <MatchDetail
            match={selectedMatch}
            onEdit={() => handleEditMatch(selectedMatch)}
            onDelete={() => handleDeleteMatch(selectedMatch.id)}
            onBack={() => { setView('matches'); setSelectedMatch(null) }}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      {(view === 'standings' || view === 'matches') && (
        <nav className="bottom-nav">
          <button
            className={`nav-item ${view === 'standings' ? 'active' : ''}`}
            onClick={() => setView('standings')}
          >
            <span className="nav-icon">🏆</span>
            <span>Tabla</span>
          </button>
          <button
            className="nav-fab"
            onClick={() => { setSelectedMatch(null); setView('new-match') }}
            title="Nueva jornada"
          >
            <span>+</span>
          </button>
          <button
            className={`nav-item ${view === 'matches' ? 'active' : ''}`}
            onClick={() => setView('matches')}
          >
            <span className="nav-icon">📋</span>
            <span>Jornadas</span>
          </button>
        </nav>
      )}

      {/* Reset modal */}
      {showReset && (
        <div className="modal-overlay" onClick={closeResetModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>

            {resetStep === 'auth' && (
              <>
                <h2>⚙️ Reiniciar Liga</h2>
                <p>Ingresa la clave para continuar</p>
                <input
                  type="password"
                  className={`auth-input modal-code-input ${resetCodeError ? 'input-error' : ''}`}
                  value={resetCode}
                  onChange={e => { setResetCode(e.target.value); setResetCodeError(false) }}
                  onKeyDown={e => e.key === 'Enter' && handleResetAuth()}
                  placeholder="• • • • • •"
                  maxLength={10}
                  autoFocus
                />
                {resetCodeError && <p className="error center" style={{marginTop: '8px'}}>Clave incorrecta</p>}
                <div className="modal-actions" style={{marginTop: '20px'}}>
                  <button className="btn-secondary" onClick={closeResetModal}>Cancelar</button>
                  <button className="btn-primary" onClick={handleResetAuth}>Continuar</button>
                </div>
              </>
            )}

            {resetStep === 'confirm' && (
              <>
                <h2>⚠️ ¿Reiniciar liga?</h2>
                <p>Se borrarán <strong>todos</strong> los resultados y estadísticas. Esta acción no se puede deshacer.</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={closeResetModal}>Cancelar</button>
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
