import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Sun, Terminal } from 'lucide-react'
import { useApp, THEMES } from '../context/AppContext'

const ICONS = { emerald: Leaf, harvest: Sun, amber: Terminal }

export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useApp()

  if (compact) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-xl glass">
        {THEMES.map((t) => {
          const Icon = ICONS[t.id]
          const active = theme === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={t.label}
              className={`relative p-2 rounded-lg transition-colors ${active ? 'text-emerald-300' : 'text-muted-sf hover:text-white'}`}
              style={active ? { color: 'var(--accent-text)' } : {}}
            >
              {active && (
                <motion.span
                  layoutId="theme-pill"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <Icon size={16} className="relative z-10" />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {THEMES.map((t) => {
        const Icon = ICONS[t.id]
        const active = theme === t.id
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`relative text-left p-4 rounded-2xl transition-all overflow-hidden ${active ? 'glass-glow glass-strong' : 'glass hover:border-emerald-500/40'}`}
          >
            <AnimatePresence>
              {active && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-3 right-3 chip chip-green !text-[0.6rem]"
                >
                  Active
                </motion.span>
              )}
            </AnimatePresence>
            <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ background: t.swatch }}>
              <Icon size={20} className="text-white drop-shadow" />
            </div>
            <p className="font-display font-bold text-sm">{t.label}</p>
            <p className="text-xs text-secondary-sf mt-1">{t.desc}</p>
          </button>
        )
      })}
    </div>
  )
}
