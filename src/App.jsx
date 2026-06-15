import { useState, useMemo } from 'react'
import { useTournamentStorage } from './hooks/useStorage'
import { recalculateAllStats } from './utils/scoring'
import Standings from './components/Standings'
import Matches from './components/Matches'
import NewMatch from './components/NewMatch'
import MatchDetail from './components/MatchDetail'
import './styles/app.css'

export default function App() {
  const { data, loading, updateMatches, resetTournament } = useTournamentStorage()
  const [view, setView] = useState('standings') // 'standings' | 'matches' | 'new-match' | 'match-detail'
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showReset, setShowReset] = useState(false)

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

  function handleReset() {
    resetTournament()
    setShowReset(false)
    setView('standings')
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <span className="header-logo">⚽</span>
          <div>
            <h1 className="header-title">Torneo</h1>
            <p className="header-sub">{matches.filter(m => m.completed).length} jornadas jugadas</p>
          </div>
        </div>
        <button className="btn-reset" onClick={() => setShowReset(true)} title="Reiniciar torneo">
          ⚙
        </button>
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
        <div className="modal-overlay" onClick={() => setShowReset(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>⚠️ Reiniciar Torneo</h2>
            <p>¿Estás seguro? Se borrarán todos los resultados y estadísticas.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowReset(false)}>Cancelar</button>
              <button className="btn-danger" onClick={handleReset}>Sí, reiniciar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
