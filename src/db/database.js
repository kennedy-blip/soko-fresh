import Dexie from 'dexie'

/**
 * SokoFresh offline database (IndexedDB via Dexie.js).
 * All field data lives locally so agents can work fully offline.
 * Tables:
 *  - batches: harvest batches from collection points
 *  - dispatches: transport manifests (truck / boda boda riders)
 *  - orders: buyer wholesale & retail orders
 *  - auditLog: immutable supply-chain audit trail
 *  - settings: theme / role preferences
 */
export const db = new Dexie('SokoFreshDB')

db.version(1).stores({
  batches: '++id, cropType, status, grade, collectionPoint, collectionTimestamp, createdAt',
  dispatches: '++id, batchId, status, driverName, departedAt, createdAt',
  orders: '++id, status, cropType, buyerName, matchedBatchId, createdAt',
  auditLog: '++id, timestamp, action, role',
  settings: 'key',
})

db.version(2).stores({
  batches: '++id, cropType, status, grade, collectionPoint, collectionTimestamp, createdAt',
  dispatches: '++id, batchId, status, driverName, departedAt, createdAt',
  orders: '++id, status, cropType, buyerName, matchedBatchId, createdAt',
  auditLog: '++id, timestamp, action, role',
  settings: 'key',
})

export const CROPS = [
  { name: 'Tomatoes', shelfHours: 72, unit: 'crates', price: 2800 },
  { name: 'Sukuma Wiki (Kale)', shelfHours: 48, unit: 'kgs', price: 60 },
  { name: 'Maize (Dry)', shelfHours: 720, unit: 'kgs', price: 55 },
  { name: 'Avocado', shelfHours: 120, unit: 'crates', price: 4200 },
  { name: 'Bananas (Musa)', shelfHours: 96, unit: 'bunches', price: 180 },
  { name: 'Mangoes', shelfHours: 96, unit: 'crates', price: 3600 },
  { name: 'Onions', shelfHours: 336, unit: 'kgs', price: 45 },
  { name: 'Carrots', shelfHours: 168, unit: 'kgs', price: 70 },
  { name: 'Capsicum', shelfHours: 96, unit: 'kgs', price: 150 },
  { name: 'Cabbage', shelfHours: 120, unit: 'kgs', price: 40 },
  { name: 'Potatoes (Irish)', shelfHours: 336, unit: 'kgs', price: 50 },
  { name: 'French Beans', shelfHours: 72, unit: 'kgs', price: 120 },
]

export const COLLECTION_POINTS = [
  'Meru Town Hub',
  'Maua Collection Shed',
  'Timau Gate Point',
  'Kangeta Aggregation',
  'Igembe East Depot',
  'Laare Market Yard',
  'Kiutine Farm Gate',
]

export const DRIVERS = [
  { name: 'Peter Mwangi', vehicle: 'Toyota Hilux · KDM 482X', type: 'Truck' },
  { name: 'Grace Achieng', vehicle: 'Honda CG 125 · KMFT 221Q', type: 'Motorcycle' },
  { name: 'Samuel Kiprop', vehicle: 'Isuzu NKR · KDC 907M', type: 'Truck' },
  { name: 'Faith Wanjiru', vehicle: 'Bajaj Boxer · KMFY 118R', type: 'Motorcycle' },
  { name: 'David Otieno', vehicle: 'Mitsubishi Canter · KDH 334P', type: 'Truck' },
]

export const BATCH_STATUSES = ['Received', 'Sorted', 'Packed', 'Dispatched', 'Spoiled']
export const DISPATCH_STATUSES = ['Scheduled', 'In Transit', 'Delivered', 'Delayed']
export const ORDER_STATUSES = ['Pending', 'Matched', 'Fulfilled', 'Cancelled']
export const GRADES = ['A', 'B', 'C']

export function perishabilityInfo(batch, now = Date.now()) {
  const expiry = batch.collectionTimestamp + batch.perishabilityHours * 3600_000
  const remainingMs = expiry - now
  const remainingHours = remainingMs / 3600_000
  let level = 'fresh'
  if (remainingMs <= 0) level = 'expired'
  else if (remainingHours <= 24) level = 'critical'
  else if (remainingHours <= 48) level = 'warning'
  const totalMs = batch.perishabilityHours * 3600_000
  const elapsedPct = Math.min(100, Math.max(0, ((now - batch.collectionTimestamp) / totalMs) * 100))
  return { expiry, remainingMs, remainingHours, level, elapsedPct }
}

export function formatCountdown(remainingMs) {
  if (remainingMs <= 0) return 'Expired'
  const mins = Math.floor(remainingMs / 60000)
  const h = Math.floor(mins / 60)
  const d = Math.floor(h / 24)
  const m = mins % 60
  if (d > 0) return `${d}d ${h % 24}h left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

export async function logAudit(action, details, role) {
  try {
    await db.auditLog.add({ action, details, role, timestamp: Date.now() })
  } catch (e) {
    console.warn('audit log failed', e)
  }
}

export async function seedIfEmpty() {
  const count = await db.batches.count()
  if (count > 0) return false

  const now = Date.now()
  const hoursAgo = (h) => now - h * 3600_000

  const batches = [
    {
      farmerName: 'Wanjiru Mwangi', cropType: 'Tomatoes', quantity: 42, unit: 'crates',
      grade: 'A', collectionPoint: 'Meru Town Hub', collectionTimestamp: hoursAgo(6),
      perishabilityHours: 72, status: 'Sorted', notes: 'Vine-ripened, firm. Cold-chain ready.',
      createdAt: hoursAgo(6), updatedAt: hoursAgo(2),
    },
    {
      farmerName: 'Otieno Ochieng', cropType: 'Sukuma Wiki (Kale)', quantity: 180, unit: 'kgs',
      grade: 'A', collectionPoint: 'Maua Collection Shed', collectionTimestamp: hoursAgo(20),
      perishabilityHours: 48, status: 'Packed', notes: 'Washed & bundled. Needs dispatch within 24h.',
      createdAt: hoursAgo(20), updatedAt: hoursAgo(5),
    },
    {
      farmerName: 'Kamau Njoroge', cropType: 'Avocado', quantity: 28, unit: 'crates',
      grade: 'A', collectionPoint: 'Timau Gate Point', collectionTimestamp: hoursAgo(30),
      perishabilityHours: 120, status: 'Received', notes: 'Hass variety, export grade.',
      createdAt: hoursAgo(30), updatedAt: hoursAgo(30),
    },
    {
      farmerName: 'Achieng Odhiambo', cropType: 'Bananas (Musa)', quantity: 95, unit: 'bunches',
      grade: 'B', collectionPoint: 'Kangeta Aggregation', collectionTimestamp: hoursAgo(50),
      perishabilityHours: 96, status: 'Sorted', notes: 'Mixed ripeness — sort before packing.',
      createdAt: hoursAgo(50), updatedAt: hoursAgo(10),
    },
    {
      farmerName: 'Kiprop Bett', cropType: 'Maize (Dry)', quantity: 1200, unit: 'kgs',
      grade: 'B', collectionPoint: 'Igembe East Depot', collectionTimestamp: hoursAgo(72),
      perishabilityHours: 720, status: 'Packed', notes: 'Moisture 13.5%. Mill-ready.',
      createdAt: hoursAgo(72), updatedAt: hoursAgo(24),
    },
    {
      farmerName: 'Nyambura Chege', cropType: 'Mangoes', quantity: 35, unit: 'crates',
      grade: 'A', collectionPoint: 'Laare Market Yard', collectionTimestamp: hoursAgo(14),
      perishabilityHours: 96, status: 'Received', notes: 'Ngowe variety, tree-ripened.',
      createdAt: hoursAgo(14), updatedAt: hoursAgo(14),
    },
    {
      farmerName: 'Brian Mwangi', cropType: 'Onions', quantity: 450, unit: 'kgs',
      grade: 'B', collectionPoint: 'Kiutine Farm Gate', collectionTimestamp: hoursAgo(100),
      perishabilityHours: 336, status: 'Packed', notes: 'Cured, netted in 10kg bags.',
      createdAt: hoursAgo(100), updatedAt: hoursAgo(48),
    },
    {
      farmerName: 'Mercy Kagure', cropType: 'Capsicum', quantity: 60, unit: 'kgs',
      grade: 'A', collectionPoint: 'Meru Town Hub', collectionTimestamp: hoursAgo(40),
      perishabilityHours: 96, status: 'Received', notes: 'Red & green mix, glossy.',
      createdAt: hoursAgo(40), updatedAt: hoursAgo(40),
    },
  ]

  const batchIds = []
  for (const b of batches) {
    const id = await db.batches.add(b)
    batchIds.push(id)
  }

  await db.dispatches.bulkAdd([
    {
      batchId: batchIds[1], driverName: 'Grace Achieng', vehicleType: 'Motorcycle',
      vehiclePlate: 'KMFT 221Q', destination: 'Meru Town Hub → Nairobi Market',
      status: 'In Transit', departedAt: hoursAgo(3), eta: hoursAgo(-5),
      manifest: '180kg sukuma wiki, 12 crates. Fragile leafy — keep shaded.',
      createdAt: hoursAgo(4),
    },
    {
      batchId: batchIds[4], driverName: 'Samuel Kiprop', vehicleType: 'Truck',
      vehiclePlate: 'KDC 907M', destination: 'Igembe East Depot → Eldoret Millers',
      status: 'Scheduled', departedAt: null, eta: hoursAgo(-26),
      manifest: '1200kg dry maize, tarpaulin covered. Weighbridge ticket required.',
      createdAt: hoursAgo(24),
    },
    {
      batchId: batchIds[0], driverName: 'Peter Mwangi', vehicleType: 'Truck',
      vehiclePlate: 'KDM 482X', destination: 'Meru Town Hub → Nakuru FreshMart',
      status: 'Delivered', departedAt: hoursAgo(28), eta: hoursAgo(26),
      manifest: '42 crates tomatoes, Grade A. Delivered with zero bruising.',
      createdAt: hoursAgo(30),
    },
  ])

  await db.orders.bulkAdd([
    {
      buyerName: 'Nairobi FreshMart Ltd', buyerType: 'Wholesale', cropType: 'Tomatoes',
      quantity: 40, unit: 'crates', pricePerUnit: 2800, status: 'Fulfilled',
      matchedBatchId: batchIds[0], createdAt: hoursAgo(30), fulfilledAt: hoursAgo(26),
    },
    {
      buyerName: 'Maua Hotel Catering', buyerType: 'Retail', cropType: 'Sukuma Wiki (Kale)',
      quantity: 120, unit: 'kgs', pricePerUnit: 60, status: 'Matched',
      matchedBatchId: batchIds[1], createdAt: hoursAgo(8), fulfilledAt: null,
    },
    {
      buyerName: 'ExportCo Kenya (Avocado)', buyerType: 'Wholesale', cropType: 'Avocado',
      quantity: 25, unit: 'crates', pricePerUnit: 4200, status: 'Pending',
      matchedBatchId: null, createdAt: hoursAgo(12), fulfilledAt: null,
    },
    {
      buyerName: 'Kangeta Retailers Assoc.', buyerType: 'Retail', cropType: 'Bananas (Musa)',
      quantity: 80, unit: 'bunches', pricePerUnit: 180, status: 'Pending',
      matchedBatchId: null, createdAt: hoursAgo(6), fulfilledAt: null,
    },
    {
      buyerName: 'Eldoret Millers Co.', buyerType: 'Wholesale', cropType: 'Maize (Dry)',
      quantity: 1000, unit: 'kgs', pricePerUnit: 55, status: 'Matched',
      matchedBatchId: batchIds[4], createdAt: hoursAgo(48), fulfilledAt: null,
    },
  ])

  await logAudit('SEED', 'Initial demo dataset seeded (8 batches, 3 dispatches, 5 orders)', 'system')
  return true
}

export async function getStorageStats() {
  const [batches, dispatches, orders, auditLog] = await Promise.all([
    db.batches.toArray(),
    db.dispatches.toArray(),
    db.orders.toArray(),
    db.auditLog.toArray(),
  ])
  const bytes = new Blob([JSON.stringify({ batches, dispatches, orders, auditLog })]).size
  return {
    batches: batches.length,
    dispatches: dispatches.length,
    orders: orders.length,
    auditEntries: auditLog.length,
    bytes,
    kb: (bytes / 1024).toFixed(1),
  }
}

export async function exportAuditReport() {
  const rows = await db.auditLog.orderBy('timestamp').toArray()
  const batches = await db.batches.toArray()
  const dispatches = await db.dispatches.toArray()
  const orders = await db.orders.toArray()

  const csvEscape = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replaceAll('"', '""')}"` : s
  }

  const lines = []
  lines.push('SokoFresh Supply Chain Audit Report')
  lines.push(`Generated,${new Date().toISOString()}`)
  lines.push('')
  lines.push('AUDIT LOG')
  lines.push('timestamp,role,action,details')
  for (const r of rows) {
    lines.push([new Date(r.timestamp).toISOString(), r.role, r.action, r.details].map(csvEscape).join(','))
  }
  lines.push('')
  lines.push('BATCHES')
  lines.push('id,farmer,crop,quantity,unit,grade,point,status,collectedAt')
  for (const b of batches) {
    lines.push([b.id, b.farmerName, b.cropType, b.quantity, b.unit, b.grade, b.collectionPoint, b.status, new Date(b.collectionTimestamp).toISOString()].map(csvEscape).join(','))
  }
  lines.push('')
  lines.push('DISPATCHES')
  lines.push('id,batchId,driver,vehicle,status,destination,departedAt')
  for (const d of dispatches) {
    lines.push([d.id, d.batchId, d.driverName, d.vehiclePlate, d.status, d.destination, d.departedAt ? new Date(d.departedAt).toISOString() : ''].map(csvEscape).join(','))
  }
  lines.push('')
  lines.push('ORDERS')
  lines.push('id,buyer,type,crop,quantity,unit,pricePerUnit,status,matchedBatchId')
  for (const o of orders) {
    lines.push([o.id, o.buyerName, o.buyerType, o.cropType, o.quantity, o.unit, o.pricePerUnit, o.status, o.matchedBatchId ?? ''].map(csvEscape).join(','))
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sokofresh-audit-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
