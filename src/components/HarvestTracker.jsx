import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Search, ChevronDown, Trash2, Lock, Timer, MapPin, User, Package,
  AlertTriangle, Clock, CheckCircle2, Minus, Pencil, X, Sprout,
} from 'lucide-react'
import { db, CROPS, COLLECTION_POINTS, BATCH_STATUSES, GRADES, perishabilityInfo, formatCountdown, logAudit } from '../db/database'
import { useApp } from '../context/AppContext'

const spring = { type: 'spring', stiffness: 300, damping: 25 }

function statusChip(status) {
  const map = {
    Received: 'chip-blue', Sorted: 'chip-lime', Packed: 'chip-green',
    Dispatched: 'chip-amber', Spoiled: 'chip-red',
  }
  return map[status] || 'chip-slate'
}

function gradeChip(grade) {
  return grade === 'A' ? 'chip-green' : grade === 'B' ? 'chip-amber' : 'chip-slate'
}

function FreshnessBar({ batch, now }) {
  const info = perishabilityInfo(batch, now)
  const color = info.level === 'expired' || info.level === 'critical'
    ? '#f87171' : info.level === 'warning' ? '#fbbf24' : 'linear-gradient(90deg,#10b981,#a3e635)'
  const isGradient = info.level === 'fresh'
  return (
    <div>
      <div className="flex items-center justify-between text-[0.7rem] mb-1.5">
        <span className="flex items-center gap-1 font-semibold" style={{ color: info.level === 'expired' || info.level === 'critical' ? '#f87171' : info.level === 'warning' ? '#fbbf24' : 'var(--accent-text)' }}>
          <Timer size={12} />
          {formatCountdown(info.remainingMs)}
        </span>
        <span className="text-muted-sf">{info.elapsedPct.toFixed(0)}% of shelf life used</span>
      </div>
      <div className="progress-track h-2">
        <div
          className="progress-fill h-full"
          style={{ width: `${info.elapsedPct}%`, background: isGradient ? color : color }}
        />
      </div>
    </div>
  )
}

function BatchFormModal({ open, onClose, initial, onSaved }) {
  const { showToast, role } = useApp()
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({ ...initial })
      } else {
        const now = new Date()
        const isoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        setForm({
          farmerName: '', cropType: CROPS[0].name, quantity: 10, unit: CROPS[0].unit,
          grade: 'A', collectionPoint: COLLECTION_POINTS[0], collectionTimestamp: isoLocal,
          perishabilityHours: CROPS[0].shelfHours, status: 'Received', notes: '',
        })
      }
    }
  }, [open, initial])

  if (!open || !form) return null

  const onCropChange = (cropName) => {
    const crop = CROPS.find((c) => c.name === cropName)
    setForm((f) => ({ ...f, cropType: cropName, unit: crop?.unit || 'kgs', perishabilityHours: crop?.shelfHours || 72 }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.farmerName.trim()) return showToast('Farmer name is required', 'error')
    if (!(Number(form.quantity) > 0)) return showToast('Quantity must be greater than zero', 'error')
    const ts = new Date(form.collectionTimestamp).getTime()
    if (!ts || isNaN(ts)) return showToast('Valid collection time required', 'error')

    const payload = {
      farmerName: form.farmerName.trim(),
      cropType: form.cropType,
      quantity: Number(form.quantity),
      unit: form.unit,
      grade: form.grade,
      collectionPoint: form.collectionPoint,
      collectionTimestamp: ts,
      perishabilityHours: Number(form.perishabilityHours) || 72,
      status: form.status,
      notes: form.notes?.trim() || '',
      updatedAt: Date.now(),
    }

    try {
      if (initial?.id) {
        await db.batches.update(initial.id, payload)
        await logAudit('BATCH_UPDATE', `Batch #${initial.id} (${payload.cropType}) updated`, role)
        showToast('Batch updated')
      } else {
        await db.batches.add({ ...payload, createdAt: Date.now() })
        await logAudit('BATCH_CREATE', `New batch: ${payload.cropType} ${payload.quantity}${payload.unit} from ${payload.farmerName} @ ${payload.collectionPoint}`, role)
        showToast('Harvest batch logged — works offline')
      }
      onSaved?.()
      onClose()
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error')
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
                <Sprout size={20} className="text-accent-sf" />
                {initial ? 'Edit Harvest Batch' : 'Log New Harvest'}
              </h3>
              <button type="button" onClick={onClose} className="btn-ghost !p-2 !rounded-xl" aria-label="Close"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="sm:col-span-2 block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Farmer name *</span>
                <input className="input-sf" value={form.farmerName} onChange={(e) => setForm({ ...form, farmerName: e.target.value })} placeholder="e.g. Wanjiru Mwangi" autoFocus />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Crop type</span>
                <select className="input-sf" value={form.cropType} onChange={(e) => onCropChange(e.target.value)}>
                  {CROPS.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Collection point</span>
                <select className="input-sf" value={form.collectionPoint} onChange={(e) => setForm({ ...form, collectionPoint: e.target.value })}>
                  {COLLECTION_POINTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Quantity *</span>
                <input className="input-sf" type="number" min="0.1" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Unit</span>
                <select className="input-sf" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {['kgs', 'crates', 'bunches', 'bags', 'pieces'].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Grade</span>
                <select className="input-sf" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                  {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Status</span>
                <select className="input-sf" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {BATCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Collected at</span>
                <input className="input-sf" type="datetime-local" value={form.collectionTimestamp} onChange={(e) => setForm({ ...form, collectionTimestamp: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Shelf life (hours)</span>
                <input className="input-sf" type="number" min="1" value={form.perishabilityHours} onChange={(e) => setForm({ ...form, perishabilityHours: e.target.value })} />
              </label>
              <label className="sm:col-span-2 block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Notes</span>
                <textarea className="input-sf" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Quality notes, sorting remarks…" />
              </label>
            </div>

            <div className="flex gap-2 mt-5">
              <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center">
                <CheckCircle2 size={16} /> {initial ? 'Save changes' : 'Log harvest'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function HarvestTracker() {
  const { isAdmin, showToast, role } = useApp()
  const batches = useLiveQuery(() => db.batches.orderBy('collectionTimestamp').reverse().toArray(), []) || []
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [cropFilter, setCropFilter] = useState('All')
  const [sort, setSort] = useState('newest')
  const [expanded, setExpanded] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const crops = useMemo(() => ['All', ...new Set(batches.map((b) => b.cropType))], [batches])

  const filtered = useMemo(() => {
    let list = batches.filter((b) => {
      const q = search.toLowerCase()
      const matchesQ = !q || b.farmerName.toLowerCase().includes(q) || b.cropType.toLowerCase().includes(q) || b.collectionPoint.toLowerCase().includes(q)
      const matchesS = statusFilter === 'All' || b.status === statusFilter
      const matchesC = cropFilter === 'All' || b.cropType === cropFilter
      return matchesQ && matchesS && matchesC
    })
    if (sort === 'newest') list.sort((a, b) => b.collectionTimestamp - a.collectionTimestamp)
    if (sort === 'oldest') list.sort((a, b) => a.collectionTimestamp - b.collectionTimestamp)
    if (sort === 'urgent') list.sort((a, b) => perishabilityInfo(a, now).remainingMs - perishabilityInfo(b, now).remainingMs)
    if (sort === 'quantity') list.sort((a, b) => b.quantity - a.quantity)
    return list
  }, [batches, search, statusFilter, cropFilter, sort, now])

  const stats = useMemo(() => {
    const active = batches.filter((b) => b.status !== 'Spoiled')
    const critical = batches.filter((b) => {
      const l = perishabilityInfo(b, now).level
      return l === 'critical' || l === 'expired'
    }).length
    const totalQty = active.reduce((s, b) => s + Number(b.quantity || 0), 0)
    return { total: batches.length, active: active.length, critical, totalQty }
  }, [batches, now])

  const adjustQty = async (batch, delta) => {
    const next = Math.max(0, Number(batch.quantity) + delta)
    await db.batches.update(batch.id, { quantity: next, updatedAt: Date.now() })
    await logAudit('BATCH_QTY', `Batch #${batch.id} quantity ${batch.quantity} → ${next}${batch.unit}`, role)
  }

  const changeStatus = async (batch, status) => {
    await db.batches.update(batch.id, { status, updatedAt: Date.now() })
    await logAudit('BATCH_STATUS', `Batch #${batch.id} status → ${status}`, role)
    showToast(`Batch #${batch.id} marked ${status}`)
  }

  const changeGrade = async (batch, grade) => {
    if (!isAdmin) return showToast('Only Warehouse Managers can override grades', 'error')
    await db.batches.update(batch.id, { grade, updatedAt: Date.now() })
    await logAudit('GRADE_OVERRIDE', `Batch #${batch.id} grade ${batch.grade} → ${grade} (manager override)`, role)
    showToast(`Grade overridden to ${grade}`)
  }

  const removeBatch = async (batch) => {
    if (!isAdmin) return showToast('Only Warehouse Managers can delete batches', 'error')
    if (!window.confirm(`Delete batch #${batch.id} (${batch.cropType} from ${batch.farmerName})? This cannot be undone.`)) return
    await db.batches.delete(batch.id)
    await logAudit('BATCH_DELETE', `Batch #${batch.id} deleted`, role)
    showToast('Batch deleted')
  }

  return (
    <div>
      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total batches', value: stats.total, icon: Package, tone: 'var(--accent-text)' },
          { label: 'Active batches', value: stats.active, icon: Sprout, tone: 'var(--accent-text)' },
          { label: 'Critical / expired', value: stats.critical, icon: AlertTriangle, tone: stats.critical ? '#f87171' : 'var(--accent-text)' },
          { label: 'Units in stock', value: stats.totalQty.toLocaleString(), icon: Clock, tone: 'var(--accent-text)' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.05 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-sf">{s.label}</p>
              <s.icon size={16} style={{ color: s.tone }} />
            </div>
            <p className="font-display font-extrabold text-2xl mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass rounded-2xl p-3 mb-4 flex flex-col lg:flex-row gap-2 lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-sf" />
          <input
            className="input-sf !pl-9"
            placeholder="Search farmer, crop, collection point…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="input-sf !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            {BATCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input-sf !w-auto" value={cropFilter} onChange={(e) => setCropFilter(e.target.value)}>
            {crops.map((c) => <option key={c} value={c}>{c === 'All' ? 'All crops' : c}</option>)}
          </select>
          <select className="input-sf !w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="urgent">Most urgent</option>
            <option value="quantity">Largest quantity</option>
          </select>
          <button onClick={() => { setEditing(null); setFormOpen(true) }} className="btn-primary">
            <Plus size={16} /> Log harvest
          </button>
        </div>
      </div>

      {/* Batch list */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {filtered.map((batch) => {
            const info = perishabilityInfo(batch, now)
            const isOpen = expanded === batch.id
            return (
              <motion.div
                key={batch.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={spring}
                className={`glass rounded-2xl overflow-hidden ${info.level === 'critical' || info.level === 'expired' ? '!border-red-500/40' : ''}`}
              >
                <button
                  className="w-full text-left p-4 flex items-center gap-3"
                  onClick={() => setExpanded(isOpen ? null : batch.id)}
                >
                  <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-display font-extrabold text-sm"
                    style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(163,230,53,0.18))', border: '1px solid var(--glass-border)', color: 'var(--accent-text)' }}>
                    {batch.cropType.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold truncate">{batch.cropType}</p>
                      <span className={`chip ${statusChip(batch.status)}`}>{batch.status}</span>
                      <span className={`chip ${gradeChip(batch.grade)}`}>Grade {batch.grade}</span>
                      {(info.level === 'critical' || info.level === 'expired') && (
                        <span className="chip chip-red"><AlertTriangle size={10} /> {info.level === 'expired' ? 'Expired' : 'Critical'}</span>
                      )}
                    </div>
                    <p className="text-xs text-secondary-sf mt-1 truncate">
                      {batch.farmerName} · {batch.quantity} {batch.unit} · {batch.collectionPoint}
                    </p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="font-display font-extrabold">{batch.quantity} <span className="text-xs font-semibold text-muted-sf">{batch.unit}</span></p>
                    <p className="text-[0.65rem] text-muted-sf">{formatCountdown(info.remainingMs)}</p>
                  </div>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={spring}>
                    <ChevronDown size={18} className="text-muted-sf" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={spring}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t divider-sf">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 text-secondary-sf"><User size={14} /> {batch.farmerName}</p>
                            <p className="flex items-center gap-2 text-secondary-sf"><MapPin size={14} /> {batch.collectionPoint}</p>
                            <p className="flex items-center gap-2 text-secondary-sf"><Clock size={14} /> Collected {new Date(batch.collectionTimestamp).toLocaleString()}</p>
                            {batch.notes && <p className="text-xs text-muted-sf leading-relaxed pt-1">{batch.notes}</p>}
                          </div>
                          <div>
                            <FreshnessBar batch={batch} now={now} />
                            <div className="flex flex-wrap items-center gap-2 mt-4">
                              <div className="flex items-center gap-1 glass rounded-xl p-1">
                                <button onClick={() => adjustQty(batch, -1)} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="Decrease quantity"><Minus size={14} /></button>
                                <span className="text-sm font-bold px-2 min-w-[3rem] text-center">{batch.quantity} {batch.unit}</span>
                                <button onClick={() => adjustQty(batch, 1)} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="Increase quantity"><Plus size={14} /></button>
                              </div>
                              <select
                                className="input-sf !w-auto !py-2 !text-xs"
                                value={batch.status}
                                onChange={(e) => changeStatus(batch, e.target.value)}
                              >
                                {BATCH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                              {isAdmin ? (
                                <select className="input-sf !w-auto !py-2 !text-xs" value={batch.grade} onChange={(e) => changeGrade(batch, e.target.value)} title="Override grade (manager)">
                                  {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                                </select>
                              ) : (
                                <span className="chip chip-slate" title="Grade override requires Manager role"><Lock size={10} /> Grade {batch.grade}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => { setEditing(batch); setFormOpen(true) }} className="btn-ghost !py-2 !text-xs">
                            <Pencil size={13} /> Edit batch
                          </button>
                          {isAdmin ? (
                            <button onClick={() => removeBatch(batch)} className="btn-ghost !py-2 !text-xs !border-red-500/40 !text-red-400 hover:!bg-red-500/10">
                              <Trash2 size={13} /> Delete
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-muted-sf ml-1">
                              <Lock size={12} /> Agents cannot delete records
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-10 text-center">
            <Sprout size={36} className="mx-auto mb-3 text-muted-sf" />
            <p className="font-display font-bold">No batches match your filters</p>
            <p className="text-sm text-secondary-sf mt-1">Log a new harvest or clear the search.</p>
            <button onClick={() => { setSearch(''); setStatusFilter('All'); setCropFilter('All') }} className="btn-ghost mt-4">Clear filters</button>
          </motion.div>
        )}
      </div>

      <BatchFormModal open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
    </div>
  )
}
