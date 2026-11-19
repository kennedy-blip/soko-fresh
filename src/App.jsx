import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sprout, Truck, ShoppingBag, Settings, Wifi, WifiOff, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import { seedIfEmpty } from './db/database'
import HarvestTracker from './components/HarvestTracker'
import DispatchManager from './components/DispatchManager'
import OrderBook from './components/OrderBook'
import SettingsCenter from './components/SettingsCenter'
import ThemeToggle from './components/ThemeToggle'
import RoleSwitcher from './components/RoleSwitcher'

const spring = { type: 'spring', stiffness: 300, damping: 25 }

const TABS = [
  { id: 'batches', label: 'Batches', icon: Sprout, title: 'Harvest & Batch Tracker', sub: 'Log arrivals · perishability countdowns · grades' },
  { id: 'dispatch', label: 'Dispatch', icon: Truck, title: 'Transport & Dispatch', sub: 'Driver manifests · transit status · ETAs' },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, title: 'Buyer Order Book', sub: 'Match inventory · fulfillment rates · pricing' },
  { id: 'settings', label: 'Settings', icon: Settings, title: 'Settings & APK Center', sub: 'Roles · themes · offline storage · Android build' },
]

function Toast() {
  const { toast } = useApp()
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={spring}
          className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[90] glass-strong glass-glow rounded-2xl px-4 py-3 flex items-center gap-2.5 max-w-[92vw]"
        >
          {toast.tone === 'error' ? (
            <AlertCircle size={18} className="text-red-400 shrink-0" />
          ) : toast.tone === 'info' ? (
            <Info size={18} className="text-blue-400 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          )}
          <p className="text-sm font-semibold">{toast.message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Shell() {
  const [tab, setTab] = useState('batches')
  const [ready, setReady] = useState(false)
  const { online, role } = useApp()
  const active = TABS.find((t) => t.id === tab)

  useEffect(() => {
    seedIfEmpty().then(() => setReady(true)).catch(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={spring} className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4 animate-pulse-glow" style={{ background: 'linear-gradient(135deg,#10b981,#a3e635)' }}>🌱</div>
          <p className="font-display font-extrabold text-lg">SokoFresh</p>
          <p className="text-sm text-secondary-sf mt-1">Opening offline database…</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 nav-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg,#10b981,#a3e635)', boxShadow: '0 4px 18px rgba(16,185,129,0.4)' }}>🌱</div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-base sm:text-lg leading-tight truncate">
                Soko<span className="text-accent-sf">Fresh</span>
              </h1>
              <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-sf font-bold hidden sm:block">Produce & Supply Chain OS</p>
            </div>
          </div>

          <div className="flex-1" />

          <span className={`chip ${online ? 'chip-green' : 'chip-amber'} hidden sm:inline-flex`}>
            {online ? <Wifi size={11} /> : <WifiOff size={11} />}
            {online ? 'Online' : 'Offline'}
          </span>
          <span className="chip chip-slate hidden md:inline-flex">{role === 'admin' ? 'Manager' : 'Agent'}</span>
          <ThemeToggle compact />
        </div>

        {/* Desktop tab bar */}
        <nav className="hidden md:block border-t divider-sf">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 py-2">
            {TABS.map((t) => {
              const isActive = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={isActive ? { color: 'var(--accent-text)' } : { color: 'var(--text-secondary)' }}
                >
                  {isActive && (
                    <motion.span layoutId="desktop-tab" className="absolute inset-0 rounded-xl" style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)' }} transition={spring} />
                  )}
                  <t.icon size={16} className="relative z-10" />
                  <span className="relative z-10">{t.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-28 md:pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={spring}
          >
            <div className="mb-5">
              <h2 className="font-display font-extrabold text-xl sm:text-2xl flex items-center gap-2.5">
                <active.icon size={24} className="text-accent-sf" />
                {active.title}
              </h2>
              <p className="text-sm text-secondary-sf mt-0.5">{active.sub}</p>
            </div>

            {tab === 'batches' && <HarvestTracker />}
            {tab === 'dispatch' && <DispatchManager />}
            {tab === 'orders' && <OrderBook />}
            {tab === 'settings' && (
              <>
                <div className="mb-5 max-w-xl">
                  <RoleSwitcher />
                </div>
                <SettingsCenter />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 nav-bar safe-bottom">
        <div className="grid grid-cols-4">
          {TABS.map((t) => {
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative flex flex-col items-center gap-1 py-2.5 text-[0.6rem] font-bold uppercase tracking-wider"
                style={isActive ? { color: 'var(--accent-text)' } : { color: 'var(--text-muted)' }}
              >
                {isActive && (
                  <motion.span layoutId="mobile-tab" className="absolute inset-x-3 top-1 bottom-1 rounded-xl" style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)' }} transition={spring} />
                )}
                <t.icon size={20} className="relative z-10" />
                <span className="relative z-10">{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <div className="mesh-backdrop" aria-hidden>
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>
      <div className="mesh-grid" aria-hidden />
      <Shell />
    </AppProvider>
  )
}
