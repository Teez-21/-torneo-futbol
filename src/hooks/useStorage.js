import { useState, useEffect, useCallback } from 'react'

const KEY = 'torneo_futbol_v1'

function persist(data) {
  const p = JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
  try { localStorage.setItem(KEY, p) } catch(e) {}
  try { sessionStorage.setItem(KEY, p) } catch(e) {}
}

function load() {
  for (const src of [() => localStorage.getItem(KEY), () => sessionStorage.getItem(KEY)]) {
    try { const r = src(); if (r) return JSON.parse(r) } catch(e) {}
  }
  return null
}

export function useTournamentStorage() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [lastSaved, setLastSaved] = useState(null)

  useEffect(() => {
    const saved = load()
    setData(saved || { matches: [], createdAt: new Date().toISOString() })
    if (saved?.updatedAt) setLastSaved(saved.updatedAt)
    setLoading(false)
  }, [])

  const updateMatches = useCallback((matches) => {
    setData(prev => {
      const updated = { ...prev, matches }
      persist(updated)
      setLastSaved(new Date().toISOString())
      return updated
    })
  }, [])

  const resetTournament = useCallback(() => {
    const fresh = { matches: [], createdAt: new Date().toISOString() }
    persist(fresh)
    setData(fresh)
    setLastSaved(new Date().toISOString())
  }, [])

  return { data, loading, updateMatches, resetTournament, lastSaved }
}
