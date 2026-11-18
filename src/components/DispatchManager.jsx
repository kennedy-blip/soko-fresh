import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Search, Truck, Trash2, Lock, MapPin, Package, Clock, X,
  CheckCircle2, Navigation, AlertCircle, ClipboardList,
} from 'lucide-react'
import { db, DRIVERS, DISPATCH_STATUSES, logAudit } from '../db/database'
import { useApp } from '../context/AppContext'

const spring = { type: 'spring', stiffness: 300, damping: 25 }

function statusChip(status) {
  const map = {
    Scheduled: 'chip-blue', 'In Transit': 'chip-amber',
    Delivered: 'chip-green', Delayed: 'chip-red',
  }
  return map[status] || 'chip-slate'
}

function DispatchFormModal({ open, onClose }) {
  const { showToast, role } = useApp()
  const batches = useLiveQuery(() => db.batches.toArray(), []) || []
  const [form, setForm] = useState({
    batchId: '', driverName: DRIVERS[0].name, vehicleType: DRIVERS[0].type,
    vehiclePlate: DRIVERS[0].vehicle.split('·')[1]?.trim() || '',
    destination: '', status: 'Scheduled', manifest: '', etaHours: 6,
  })

  if (!open) return null

  const onDriverChange = (name) => {
    const d = DRIVERS.find((x) => x.name === name)
    setForm((f) => ({
      ...f, driverName: name, vehicleType: d?.type || 'Truck',
      vehiclePlate: d?.vehicle.split('·')[1]?.trim() || '',
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.batchId) return showToast('Select a harvest batch to dispatch', 'error')
    if (!form.destination.trim()) return showToast('Destination is required', 'error')
    if (!form.vehiclePlate.trim()) return showToast('Vehicle plate is required', 'error')
    try {
      const batchId = Number(form.batchId)
      const id = await db.dispatches.add({
        batchId,
        driverName: form.driverName,
        vehicleType: form.vehicleType,
        vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
        destination: form.destination.trim(),
        status: form.status,
        departedAt: form.status === 'Scheduled' ? null : Date.now(),
        eta: Date.now() + Number(form.etaHours || 6) * 3600_000,
        manifest: form.manifest.trim(),
        createdAt: Date.now(),
      })
      await db.batches.update(batchId, { status: 'Dispatched', updatedAt: Date.now() })
      await logAudit('DISPATCH_CREATE', `Dispatch #${id}: batch #${batchId} → ${form.destination} via ${form.driverName}`, role)
      showToast('Dispatch manifest created — batch marked Dispatched')
      onClose()
    } catch (err) {
      showToast('Failed: ' + err.message, 'error')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={spring}
          className="glass-strong glass-glow w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92dvh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={submit} className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
                <Truck size={20} className="text-accent-sf" /> New Dispatch Manifest
              </h3>
              <button type="button" onClick={onClose} className="btn-ghost !p-2 !rounded-xl" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="sm:col-span-2 block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Harvest batch *</span>
                <select className="input-sf" value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
                  <option value="">— Select batch —</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>#{b.id} · {b.cropType} · {b.quantity}{b.unit} · {b.farmerName} ({b.status})</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Driver / rider</span>
                <select className="input-sf" value={form.driverName} onChange={(e) => onDriverChange(e.target.value)}>
                  {DRIVERS.map((d) => <option key={d.name} value={d.name}>{d.name} — {d.vehicle}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Vehicle type</span>
                <select className="input-sf" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                  <option>Truck</option><option>Motorcycle</option><option>Pickup</option><option>Bicycle</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Vehicle plate *</span>
                <input className="input-sf font-mono uppercase" value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} placeholder="KDM 482X" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Status</span>
                <select className="input-sf" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {DISPATCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="sm:col-span-2 block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Destination *</span>
                <input className="input-sf" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Meru Town Hub → Nairobi Market" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">ETA (hours from now)</span>
                <input className="input-sf" type="number" min="0.5" step="0.5" value={form.etaHours} onChange={(e) => setForm({ ...form, etaHours: e.target.value })} />
              </label>
              <label className="sm:col-span-2 block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Manifest notes</span>
                <textarea className="input-sf" rows={2} value={form.manifest} onChange={(e) => setForm({ ...form, manifest: e.target.value })} placeholder="Load details, handling instructions…" />
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center"><CheckCircle2 size={16} /> Create manifest</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function DispatchManager() {
  const { isAdmin, showToast, role } = useApp()
  const dispatches = useLiveQuery(() => db.dispatches.orderBy('createdAt').reverse().toArray(), []) || []
  const batches = useLiveQuery(() => db.batches.toArray(), []) || []
  const batchMap = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [formOpen, setFormOpen] = useState(false)

  const filtered = dispatches.filter((d) => {
    const q = search.toLowerCase()
    const matchesQ = !q || d.driverName.toLowerCase().includes(q) || d.destination.toLowerCase().includes(q) || d.vehiclePlate.toLowerCase().includes(q)
    const matchesS = statusFilter === 'All' || d.status === statusFilter
    return matchesQ && matchesS
  })

  const stats = useMemo(() => ({
    total: dispatches.length,
    transit: dispatches.filter((d) => d.status === 'In Transit').length,
    delivered: dispatches.filter((d) => d.status === 'Delivered').length,
    delayed: dispatches.filter((d) => d.status === 'Delayed').length,
  }), [dispatches])

  const setStatus = async (d, status) => {
    const patch = { status }
    if (status === 'In Transit' && !d.departedAt) patch.departedAt = Date.now()
    if (status === 'Delivered') patch.departedAt = d.departedAt || Date.now()
    await db.dispatches.update(d.id, patch)
    await logAudit('DISPATCH_STATUS', `Dispatch #${d.id} → ${status}`, role)
    showToast(`Dispatch #${d.id} marked ${status}`)
  }

  const remove = async (d) => {
    if (!isAdmin) return showToast('Only Warehouse Managers can delete dispatch records', 'error')
    if (!window.confirm(`Delete dispatch #${d.id} (${d.driverName} → ${d.destination})?`)) return
    await db.dispatches.delete(d.id)
    await logAudit('DISPATCH_DELETE', `Dispatch #${d.id} deleted`, role)
    showToast('Dispatch record deleted')
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total manifests', value: stats.total, icon: ClipboardList },
          { label: 'In transit', value: stats.transit, icon: Navigation },
          { label: 'Delivered', value: stats.delivered, icon: CheckCircle2 },
          { label: 'Delayed', value: stats.delayed, icon: AlertCircle },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.05 }} className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-sf">{s.label}</p>
              <s.icon size={16} className="text-accent-sf" />
            </div>
            <p className="font-display font-extrabold text-2xl mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-2xl p-3 mb-4 flex flex-col lg:flex-row gap-2 lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-sf" />
          <input className="input-sf !pl-9" placeholder="Search driver, destination, plate…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="input-sf !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            {DISPATCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setFormOpen(true)} className="btn-primary"><Plus size={16} /> New dispatch</button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {filtered.map((d) => {
            const batch = batchMap[d.batchId]
            return (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={spring}
                className="glass rounded-2xl p-4"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(163,230,53,0.16))', border: '1px solid var(--glass-border)' }}>
                    <Truck size={20} className="text-accent-sf" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold">{d.driverName}</p>
                      <span className={`chip ${statusChip(d.status)}`}>{d.status}</span>
                      <span className="chip chip-slate font-mono">{d.vehiclePlate}</span>
                    </div>
                    <p className="text-xs text-secondary-sf mt-1 flex items-center gap-1.5">
                      <MapPin size={12} /> {d.destination}
                    </p>
                    <p className="text-xs text-muted-sf mt-0.5 flex items-center gap-1.5">
                      <Package size={12} />
                      {batch ? `Batch #${batch.id} · ${batch.cropType} · ${batch.quantity}${batch.unit}` : `Batch #${d.batchId} (removed)`}
                      {' '}· {d.vehicleType}
                    </p>
                    {d.manifest && <p className="text-xs text-muted-sf mt-2 leading-relaxed">{d.manifest}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="text-[0.65rem] text-muted-sf flex items-center gap-1">
                        <Clock size={11} />
                        {d.departedAt ? `Departed ${new Date(d.departedAt).toLocaleString()}` : 'Not yet departed'}
                        {d.eta ? ` · ETA ${new Date(d.eta).toLocaleString()}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <select className="input-sf !w-auto !py-2 !text-xs" value={d.status} onChange={(e) => setStatus(d, e.target.value)}>
                      {DISPATCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {isAdmin ? (
                      <button onClick={() => remove(d)} className="btn-ghost !py-2 !text-xs !border-red-500/40 !text-red-400" aria-label="Delete dispatch">
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[0.65rem] text-muted-sf" title="Agents cannot delete delivery records">
                        <Lock size={11} /> Locked
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-10 text-center">
            <Truck size={36} className="mx-auto mb-3 text-muted-sf" />
            <p className="font-display font-bold">No dispatches found</p>
            <p className="text-sm text-secondary-sf mt-1">Assign a harvest batch to a driver to create a manifest.</p>
            <button onClick={() => setFormOpen(true)} className="btn-primary mt-4"><Plus size={16} /> New dispatch</button>
          </motion.div>
        )}
      </div>

      <DispatchFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
