import { motion } from 'framer-motion'
import { ShieldCheck, Sprout, Lock } from 'lucide-react'
import { useApp, ROLES } from '../context/AppContext'

export default function RoleSwitcher() {
  const { role, setRole, showToast } = useApp()

  const switchRole = (id) => {
    if (id === role) return
    setRole(id)
    showToast(`Switched to ${ROLES[id].label}`, 'info')
  }

  return (
    <div className="glass rounded-2xl p-1.5 flex gap-1.5">
      {Object.values(ROLES).map((r) => {
        const active = role === r.id
        const Icon = r.id === 'admin' ? ShieldCheck : Sprout
        return (
          <button
            key={r.id}
            onClick={() => switchRole(r.id)}
            className="relative flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={active ? { color: 'var(--accent-text)' } : { color: 'var(--text-secondary)' }}
          >
            {active && (
              <motion.span
                layoutId="role-pill"
                className="absolute inset-0 rounded-xl"
                style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <Icon size={16} className="relative z-10" />
            <span className="relative z-10 hidden sm:inline">{r.label}</span>
            <span className="relative z-10 sm:hidden">{r.short}</span>
          </button>
        )
      })}
    </div>
  )
}

export function RoleGate({ children, adminOnly = false, fallback = null }) {
  const { isAdmin } = useApp()
  if (adminOnly && !isAdmin) {
    if (fallback) return fallback
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-sf" title="Requires Warehouse Manager role">
        <Lock size={12} /> Manager only
      </span>
    )
  }
  return <>{children}</>
}
