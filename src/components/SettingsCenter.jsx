import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Download, Database, FileDown, Trash2, RefreshCw, Wifi, WifiOff,
  ShieldCheck, HardDrive, Palette, Smartphone, Info, CheckCircle2,
} from 'lucide-react'
import { db, getStorageStats, exportAuditReport, logAudit, seedIfEmpty } from '../db/database'
import { useApp } from '../context/AppContext'
import ThemeToggle from './ThemeToggle'
import RoleSwitcher, { RoleGate } from './RoleSwitcher'
import DownloadAPKModal from './DownloadAPKModal'

const spring = { type: 'spring', stiffness: 300, damping: 25 }

export default function SettingsCenter() {
  const { isAdmin, online, showToast, role } = useApp()
  const [stats, setStats] = useState(null)
  const [apkOpen, setApkOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const refresh = async () => setStats(await getStorageStats())
  useEffect(() => { refresh() }, [])

  const handleExport = async () => {
    if (!isAdmin) return showToast('Audit export requires Warehouse Manager role', 'error')
    setBusy(true)
    try {
      await exportAuditReport()
      await logAudit('AUDIT_EXPORT', 'Supply chain audit report exported (CSV)', role)
      showToast('Audit report downloaded')
    } catch (e) {
      showToast('Export failed: ' + e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleClearCache = async () => {
    if (!window.confirm('Clear all local SokoFresh data? Batches, dispatches, orders and audit log will be removed.')) return
    setBusy(true)
    try {
      await Promise.all([db.batches.clear(), db.dispatches.clear(), db.orders.clear(), db.auditLog.clear()])
      await seedIfEmpty()
      await refresh()
      showToast('Local data cleared and reseeded')
    } finally {
      setBusy(false)
    }
  }

  const handleReseed = async () => {
    setBusy(true)
    try {
      await Promise.all([db.batches.clear(), db.dispatches.clear(), db.orders.clear(), db.auditLog.clear()])
      await seedIfEmpty()
      await refresh()
      showToast('Demo data restored')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* APK Center */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="glass glass-glow rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(163,230,53,0.5), transparent 70%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center text-3xl animate-float-slow" style={{ background: 'linear-gradient(135deg,#10b981,#a3e635)', boxShadow: '0 8px 28px rgba(16,185,129,0.4)' }}>
            🌱
          </div>
          <div className="flex-1">
            <h3 className="font-display font-extrabold text-xl">APK Center</h3>
            <p className="text-sm text-secondary-sf mt-1 leading-relaxed">
              Take SokoFresh to the field. The Android build runs 100% offline with IndexedDB storage —
              log harvests at the collection shed with zero signal.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="chip chip-green">v1.0.0</span>
              <span className="chip chip-lime">Offline-first</span>
              <span className="chip chip-blue">Android 5.1+</span>
              <span className="chip chip-slate flex items-center gap-1">
                {online ? <Wifi size={10} /> : <WifiOff size={10} />} {online ? 'Online' : 'Offline mode'}
              </span>
            </div>
          </div>
          <button onClick={() => setApkOpen(true)} className="btn-primary !py-3.5 !px-6 !text-base shrink-0 justify-center">
            <Download size={20} /> Download Android APK
          </button>
        </div>
      </motion.section>

      {/* Role */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }} className="glass rounded-3xl p-6">
        <h3 className="font-display font-extrabold text-lg flex items-center gap-2 mb-1">
          <ShieldCheck size={20} className="text-accent-sf" /> Role & Privileges
        </h3>
        <p className="text-sm text-secondary-sf mb-4">
          {isAdmin
            ? 'You have full Warehouse Manager access: pricing, grade overrides, driver assignment, exports and deletes.'
            : 'Field Agent mode: log harvests, update quantities and view routes. Pricing, deletes and exports are locked.'}
        </p>
        <RoleSwitcher />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
          <div className="glass rounded-xl p-3">
            <p className="font-bold mb-1.5 flex items-center gap-1.5"><CheckCircle2 size={13} className="text-accent-sf" /> Manager can</p>
            <ul className="text-secondary-sf space-y-1 list-disc list-inside">
              <li>Adjust pricing tiers</li>
              <li>Override batch grades</li>
              <li>Assign drivers & delete records</li>
              <li>Export audit reports</li>
            </ul>
          </div>
          <div className="glass rounded-xl p-3">
            <p className="font-bold mb-1.5 flex items-center gap-1.5"><CheckCircle2 size={13} className="text-accent-sf" /> Agent can</p>
            <ul className="text-secondary-sf space-y-1 list-disc list-inside">
              <li>Log new harvest arrivals</li>
              <li>Update batch quantities & status</li>
              <li>View active dispatch routes</li>
              <li>Create orders & manifests</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Theme */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }} className="glass rounded-3xl p-6">
        <h3 className="font-display font-extrabold text-lg flex items-center gap-2 mb-1">
          <Palette size={20} className="text-accent-sf" /> Theme Engine
        </h3>
        <p className="text-sm text-secondary-sf mb-4">Terminal Amber is tuned for bright sunlight in outdoor collection sheds.</p>
        <ThemeToggle />
      </motion.section>

      {/* Storage */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.15 }} className="glass rounded-3xl p-6">
        <h3 className="font-display font-extrabold text-lg flex items-center gap-2 mb-4">
          <Database size={20} className="text-accent-sf" /> Local Storage (Offline DB)
        </h3>
        {stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Batches', value: stats.batches },
              { label: 'Dispatches', value: stats.dispatches },
              { label: 'Orders', value: stats.orders },
              { label: 'Audit entries', value: stats.auditEntries },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3 text-center">
                <p className="font-display font-extrabold text-xl">{s.value}</p>
                <p className="text-[0.65rem] uppercase tracking-wider text-muted-sf font-bold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-sf mb-4">Loading storage stats…</p>
        )}
        <div className="flex items-center gap-2 text-xs text-secondary-sf mb-4">
          <HardDrive size={14} />
          <span>IndexedDB footprint: <strong className="text-accent-sf">{stats?.kb ?? '—'} KB</strong> · Syncs automatically when back online</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refresh} className="btn-ghost !text-xs"><RefreshCw size={13} /> Refresh stats</button>
          <RoleGate adminOnly>
            <button onClick={handleExport} disabled={busy} className="btn-ghost !text-xs">
              <FileDown size={13} /> Export audit report (CSV)
            </button>
          </RoleGate>
          <button onClick={handleReseed} disabled={busy} className="btn-ghost !text-xs">
            <RefreshCw size={13} /> Restore demo data
          </button>
          <RoleGate adminOnly>
            <button onClick={handleClearCache} disabled={busy} className="btn-ghost !text-xs !border-red-500/40 !text-red-400">
              <Trash2 size={13} /> Clear local data
            </button>
          </RoleGate>
        </div>
      </motion.section>

      {/* About */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.2 }} className="glass rounded-3xl p-6">
        <h3 className="font-display font-extrabold text-lg flex items-center gap-2 mb-3">
          <Info size={20} className="text-accent-sf" /> About SokoFresh
        </h3>
        <div className="text-sm text-secondary-sf space-y-2 leading-relaxed">
          <p><strong className="text-accent-sf">SokoFresh</strong> is an Agricultural Produce & Supply Chain Logistics OS built to cut post-harvest food loss in rural Kenya. Every harvest, truck and buyer order is tracked from farm gate to market.</p>
          <p className="flex items-center gap-2"><Smartphone size={14} className="shrink-0" /> Dual deployment: Vercel web app + Capacitor Android APK. All data lives on-device via Dexie.js (IndexedDB) — fully offline capable.</p>
          <p className="text-xs text-muted-sf">Stack: React + Vite + Tailwind + Framer Motion + Dexie + Capacitor · Collection hubs: Meru County, Kenya</p>
        </div>
      </motion.section>

      <DownloadAPKModal open={apkOpen} onClose={() => setApkOpen(false)} />
    </div>
  )
}
