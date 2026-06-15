import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'torneo_futbol_v1'

// Guarda en localStorage Y sessionStorage como respaldo
function persistData(data) {
  const payload = JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
  try { localStorage.setItem(STORAGE_KEY, payload) } catch (e) { console.warn('localStorage error:', e) }
  try { sessionStorage.setItem(STORAGE_KEY, payload) } catch (e) { console.warn('sessionStorage error:', e) }
}

// Lee de localStorage primero, sessionStorage como fallback
function loadData() {
  const sources = [
    () => localStorage.getItem(STORAGE_KEY),
    () => sessionStorage.getItem(STORAGE_KEY),
  ]
  for (const source of sources) {
    try {
      const raw = source()
      if (raw) return JSON.parse(raw)
    } catch (e) { /* continuar al siguiente */ }
  }
  return null
}

export function useTournamentStorage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState(null) // timestamp del último guardado exitoso

  useEffect(() => {
    const saved = loadData()
    if (saved) {
      setData(saved)
      setLastSaved(saved.updatedAt || null)
    } else {
      setData({ matches: [], currentRound: 1, createdAt: new Date().toISOString() })
    }
    setLoading(false)
  }, [])

  const updateMatches = useCallback((matches) => {
    setData(prev => {
      const updated = { ...prev, matches }
      try {
        persistData(updated)
        setLastSaved(new Date().toISOString())
      } catch (e) {
        console.error('Error guardando:', e)
      }
      return updated
    })
  }, [])

  const resetTournament = useCallback(() => {
    const fresh = { matches: [], currentRound: 1, createdAt: new Date().toISOString() }
    persistData(fresh)
    setData(fresh)
    setLastSaved(new Date().toISOString())
  }, [])

  return { data, loading, updateMatches, resetTournament, lastSaved }
}
