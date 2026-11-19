import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Search, ShoppingBag, Trash2, Lock, X, CheckCircle2,
  TrendingUp, PackageCheck, Clock3, Ban, Link2,
} from 'lucide-react'
import { db, CROPS, ORDER_STATUSES, logAudit } from '../db/database'
import { useApp } from '../context/AppContext'

const spring = { type: 'spring', stiffness: 300, damping: 25 }

function statusChip(status) {
  const map = { Pending: 'chip-amber', Matched: 'chip-blue', Fulfilled: 'chip-green', Cancelled: 'chip-red' }
  return map[status] || 'chip-slate'
}

function OrderFormModal({ open, onClose }) {
  const { showToast, role } = useApp()
  const [form, setForm] = useState({
    buyerName: '', buyerType: 'Wholesale', cropType: CROPS[0].name,
    quantity: 10, unit: CROPS[0].unit, pricePerUnit: CROPS[0].price, status: 'Pending',
  })

  if (!open) return null

  const onCropChange = (name) => {
    const c = CROPS.find((x) => x.name === name)
    setForm((f) => ({ ...f, cropType: name, unit: c?.unit || 'kgs', pricePerUnit: c?.price || 0 }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.buyerName.trim()) return showToast('Buyer name is required', 'error')
    if (!(Number(form.quantity) > 0)) return showToast('Quantity must be greater than zero', 'error')
    if (!(Number(form.pricePerUnit) >= 0)) return showToast('Price must be zero or more', 'error')
    try {
      const id = await db.orders.add({
        buyerName: form.buyerName.trim(),
        buyerType: form.buyerType,
        cropType: form.cropType,
        quantity: Number(form.quantity),
        unit: form.unit,
        pricePerUnit: Number(form.pricePerUnit),
        status: form.status,
        matchedBatchId: null,
        createdAt: Date.now(),
        fulfilledAt: form.status === 'Fulfilled' ? Date.now() : null,
      })
      await logAudit('ORDER_CREATE', `Order #${id}: ${form.buyerName} — ${form.quantity}${form.unit} ${form.cropType} @ KES ${form.pricePerUnit}`, role)
      showToast('Buyer order logged')
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
                <ShoppingBag size={20} className="text-accent-sf" /> New Buyer Order
              </h3>
              <button type="button" onClick={onClose} className="btn-ghost !p-2 !rounded-xl" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="sm:col-span-2 block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Buyer name *</span>
                <input className="input-sf" value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} placeholder="e.g. Nairobi FreshMart Ltd" autoFocus />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Buyer type</span>
                <select className="input-sf" value={form.buyerType} onChange={(e) => setForm({ ...form, buyerType: e.target.value })}>
                  <option>Wholesale</option><option>Retail</option><option>Export</option><option>Institutional</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Crop</span>
                <select className="input-sf" value={form.cropType} onChange={(e) => onCropChange(e.target.value)}>
                  {CROPS.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
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
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Price per unit (KES)</span>
                <input className="input-sf" type="number" min="0" step="any" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-secondary-sf block mb-1.5">Status</span>
                <select className="input-sf" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center"><CheckCircle2 size={16} /> Log order</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function OrderBook() {
  const { isAdmin, showToast, role } = useApp()
  const orders = useLiveQuery(() => db.orders.orderBy('createdAt').reverse().toArray(), []) || []
  const batches = useLiveQuery(() => db.batches.toArray(), []) || []
  const batchMap = useMemo(() => Object.fromEntries(batches.map((b) => [b.id, b])), [batches])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [formOpen, setFormOpen] = useState(false)

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    const matchesQ = !q || o.buyerName.toLowerCase().includes(q) || o.cropType.toLowerCase().includes(q)
    const matchesS = statusFilter === 'All' || o.status === statusFilter
    return matchesQ && matchesS
  })

  const stats = useMemo(() => {
    const total = orders.length
    const fulfilled = orders.filter((o) => o.status === 'Fulfilled').length
    const pending = orders.filter((o) => o.status === 'Pending').length
    const rate = total ? Math.round((fulfilled / total) * 100) : 0
    const pipelineValue = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((s, o) => s + Number(o.quantity || 0) * Number(o.pricePerUnit || 0), 0)
    return { total, fulfilled, pending, rate, pipelineValue }
  }, [orders])

  const availableBatchesFor = (order) =>
    batches.filter((b) => b.cropType === order.cropType && b.status !== 'Spoiled' && b.status !== 'Dispatched')

  const matchBatch = async (order, batchId) => {
    const id = batchId ? Number(batchId) : null
    await db.orders.update(order.id, { matchedBatchId: id, status: id ? 'Matched' : 'Pending' })
    await logAudit('ORDER_MATCH', `Order #${order.id} matched to batch #${id ?? '—'}`, role)
    showToast(id ? `Order matched to batch #${id}` : 'Match cleared')
  }

  const fulfill = async (order) => {
    await db.orders.update(order.id, { status: 'Fulfilled', fulfilledAt: Date.now() })
    await logAudit('ORDER_FULFILL', `Order #${order.id} (${order.buyerName}) fulfilled`, role)
    showToast(`Order for ${order.buyerName} fulfilled ✓`)
  }

  const cancel = async (order) => {
    await db.orders.update(order.id, { status: 'Cancelled' })
    await logAudit('ORDER_CANCEL', `Order #${order.id} cancelled`, role)
    showToast('Order cancelled')
  }

  const updatePrice = async (order, price) => {
    if (!isAdmin) return showToast('Only Warehouse Managers can adjust pricing', 'error')
    const p = Number(price)
    if (isNaN(p) || p < 0) return showToast('Invalid price', 'error')
    await db.orders.update(order.id, { pricePerUnit: p })
    await logAudit('PRICE_UPDATE', `Order #${order.id} price → KES ${p}/${order.unit}`, role)
    showToast(`Price updated to KES ${p}`)
  }

  const remove = async (order) => {
    if (!isAdmin) return showToast('Only Warehouse Managers can delete orders', 'error')
    if (!window.confirm(`Delete order #${order.id} (${order.buyerName})?`)) return
    await db.orders.delete(order.id)
    await logAudit('ORDER_DELETE', `Order #${order.id} deleted`, role)
    showToast('Order deleted')
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-sf">Fulfillment rate</p>
            <TrendingUp size={16} className="text-accent-sf" />
          </div>
          <p className="font-display font-extrabold text-2xl mt-1">{stats.rate}%</p>
          <div className="progress-track h-1.5 mt-2"><div className="progress-fill h-full" style={{ width: `${stats.rate}%` }} /></div>
        </motion.div>
        {[
          { label: 'Total orders', value: stats.total, icon: ShoppingBag },
          { label: 'Pending', value: stats.pending, icon: Clock3 },
          { label: 'Pipeline value', value: `KES ${(stats.pipelineValue / 1000).toFixed(0)}k`, icon: PackageCheck },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: (i + 1) * 0.05 }} className="glass rounded-2xl p-4">
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
          <input className="input-sf !pl-9" placeholder="Search buyer or crop…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="input-sf !w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setFormOpen(true)} className="btn-primary"><Plus size={16} /> New order</button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {filtered.map((o) => {
            const matched = o.matchedBatchId ? batchMap[o.matchedBatchId] : null
            const candidates = availableBatchesFor(o)
            const total = Number(o.quantity) * Number(o.pricePerUnit)
            return (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={spring}
                className="glass rounded-2xl p-4"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(96,165,250,0.18))', border: '1px solid var(--glass-border)' }}>
                    <ShoppingBag size={20} className="text-accent-sf" />
                  </div>
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold">{o.buyerName}</p>
                      <span className={`chip ${statusChip(o.status)}`}>{o.status}</span>
                      <span className="chip chip-slate">{o.buyerType}</span>
                    </div>
                    <p className="text-xs text-secondary-sf mt-1">
                      {o.quantity} {o.unit} · {o.cropType} · KES {Number(o.pricePerUnit).toLocaleString()}/{o.unit}
                      <span className="font-semibold text-accent-sf"> = KES {total.toLocaleString()}</span>
                    </p>
                    {matched && (
                      <p className="text-xs text-muted-sf mt-1 flex items-center gap-1.5">
                        <Link2 size={12} /> Matched: Batch #{matched.id} · {matched.farmerName} · {matched.quantity}{matched.unit} @ {matched.collectionPoint}
                      </p>
                    )}
                    <p className="text-[0.65rem] text-muted-sf mt-1">Logged {new Date(o.createdAt).toLocaleString()}{o.fulfilledAt ? ` · Fulfilled ${new Date(o.fulfilledAt).toLocaleString()}` : ''}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <select
                        className="input-sf !w-auto !py-2 !text-xs"
                        value={o.matchedBatchId ?? ''}
                        onChange={(e) => matchBatch(o, e.target.value)}
                        title="Match inventory batch"
                      >
                        <option value="">— Match batch —</option>
                        {candidates.map((b) => (
                          <option key={b.id} value={b.id}>#{b.id} {b.cropType} · {b.quantity}{b.unit} · {b.farmerName}</option>
                        ))}
                      </select>
                      {o.status !== 'Fulfilled' && o.status !== 'Cancelled' && (
                        <button onClick={() => fulfill(o)} className="btn-primary !py-2 !text-xs">
                          <CheckCircle2 size={13} /> Fulfill
                        </button>
                      )}
                      {o.status !== 'Cancelled' && o.status !== 'Fulfilled' && (
                        <button onClick={() => cancel(o)} className="btn-ghost !py-2 !text-xs">
                          <Ban size={13} /> Cancel
                        </button>
                      )}
                      {isAdmin ? (
                        <span className="flex items-center gap-1">
                          <input
                            type="number" min="0" step="any" defaultValue={o.pricePerUnit}
                            className="input-sf !w-24 !py-2 !text-xs"
                            onBlur={(e) => { if (Number(e.target.value) !== Number(o.pricePerUnit)) updatePrice(o, e.target.value) }}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                            title="Edit price (manager)"
                          />
                          <span className="text-[0.65rem] text-muted-sf">KES/{o.unit}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[0.65rem] text-muted-sf" title="Pricing is manager-only">
                          <Lock size={11} /> Price locked
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdmin ? (
                    <button onClick={() => remove(o)} className="btn-ghost !p-2 !rounded-xl !border-red-500/40 !text-red-400" aria-label="Delete order">
                      <Trash2 size={15} />
                    </button>
                  ) : (
                    <span className="text-muted-sf p-2" title="Agents cannot delete orders"><Lock size={15} /></span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-10 text-center">
            <ShoppingBag size={36} className="mx-auto mb-3 text-muted-sf" />
            <p className="font-display font-bold">No orders found</p>
            <p className="text-sm text-secondary-sf mt-1">Log a wholesale or retail buyer order to start matching inventory.</p>
            <button onClick={() => setFormOpen(true)} className="btn-primary mt-4"><Plus size={16} /> New order</button>
          </motion.div>
        )}
      </div>

      <OrderFormModal open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  )
}
