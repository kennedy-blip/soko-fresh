import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { db } from '../db/database'

const AppContext = createContext(null)

export const THEMES = [
  { id: 'emerald', label: 'Agro Emerald', desc: 'Default dark · obsidian + neon lime', swatch: 'linear-gradient(135deg,#070f0c,#10b981,#a3e635)' },
  { id: 'harvest', label: 'Harvest Glass', desc: 'Light frosted milk glass', swatch: 'linear-gradient(135deg,#ffffff,#dcfce7,#16a34a)' },
  { id: 'amber', label: 'Terminal Amber', desc: 'High-contrast sunlight ledger', swatch: 'linear-gradient(135deg,#0c0a06,#f59e0b,#fbbf24)' },
]

export const ROLES = {
  admin: { id: 'admin', label: 'Warehouse Manager', short: 'Manager', desc: 'Full access — pricing, grades, drivers, exports, deletes' },
  agent: { id: 'agent', label: 'Field Collection Agent', short: 'Agent', desc: 'Log harvests, update quantities, view routes' },
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('emerald')
  const [role, setRole] = useState('admin')
  const [online, setOnline] = useState(navigator.onLine)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const t = await db.settings.get('theme')
        if (t?.value) setTheme(t.value)
        const r = await db.settings.get('role')
        if (r?.value) setRole(r.value)
      } catch {}
    })()
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    db.settings.put({ key: 'theme', value: theme }).catch(() => {})
  }, [theme])

  useEffect(() => {
    db.settings.put({ key: 'role', value: role }).catch(() => {})
  }, [role])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() })
    setTimeout(() => setToast(null), 3200)
  }, [])

  const isAdmin = role === 'admin'

  return (
    <AppContext.Provider value={{ theme, setTheme, role, setRole, isAdmin, online, toast, showToast }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
