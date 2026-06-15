import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'torneo_futbol_v1'

export function useTournamentStorage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cargar datos al inicializar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setData(parsed)
      } else {
        // Estado inicial
        setData({ matches: [], currentRound: 1, createdAt: new Date().toISOString() })
      }
    } catch (e) {
      console.error('Error cargando datos:', e)
      setData({ matches: [], currentRound: 1, createdAt: new Date().toISOString() })
    } finally {
      setLoading(false)
    }
  }, [])

  // Guardar datos automáticamente
  const save = useCallback((newData) => {
    try {
      const toSave = { ...newData, updatedAt: new Date().toISOString() }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      setData(toSave)
      return true
    } catch (e) {
      console.error('Error guardando datos:', e)
      return false
    }
  }, [])

  const updateMatches = useCallback((matches) => {
    setData(prev => {
      const updated = { ...prev, matches }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...updated, updatedAt: new Date().toISOString() }))
      } catch (e) {
        console.error('Error guardando partidos:', e)
      }
      return updated
    })
  }, [])

  const resetTournament = useCallback(() => {
    const fresh = { matches: [], currentRound: 1, createdAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    setData(fresh)
  }, [])

  return { data, loading, save, updateMatches, resetTournament }
}
