import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db, stripUndefinedDeep } from '@/utils/firebase'
import type { ID, InboundNotice } from './types'
import { deletePackage, getPackageByRelation, upsertPackageByRelation } from './packages.repo'
import { createStockRecord } from './stock-records.repo'
import { adjustProductStock, adjustProductInTransit } from './products.repo'
import { COLLECTIONS } from '@/repo/config'

const COL = COLLECTIONS.INBOUND_NOTICES

export interface InboundFilter {
  status?: 'ARRIVED' | 'PENDING'
}

export async function listInboundNotices(filter: InboundFilter = {}): Promise<InboundNotice[]> {
  const col = collection(db, COL)
  const clauses: any[] = []
  if (filter.status) clauses.push(where('status', '==', filter.status))
  const q: any = clauses.length ? query(col, ...clauses) : query(col)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as InboundNotice[]
}

export async function getInboundNotice(id: ID): Promise<InboundNotice | undefined> {
  const d = await getDoc(doc(db, COL, id))
  return d.exists() ? ({ id: d.id, ...(d.data() as any) } as InboundNotice) : undefined
}

export async function createInboundNotice(n: Omit<InboundNotice, 'id' | 'createdAt' | 'updatedAt' | 'locked' | 'arrivedAt'>): Promise<ID> {
  if (!n.vendor) throw new Error('供应商必填')
  if (!n.eta) throw new Error('预计到货时间必填')
  const items = (n.items || []).filter((it: any) => it && it.productId && it.qty > 0)
  if (!items.length) throw new Error('请至少添加一条将要到货的货品，数量需大于0')
  const payload = stripUndefinedDeep({
    ...n,
    items,
    status: n.status ?? 'PENDING',
    locked: n.status === 'ARRIVED' ? true : false,
    arrivedAt: n.status === 'ARRIVED' ? serverTimestamp() : undefined,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const ref = await addDoc(collection(db, COL), payload)
  // Upsert package if trackingUrl present
  if (n.trackingUrl) {
    await upsertPackageByRelation('InboundNotice', ref.id, {
      trackingUrl: n.trackingUrl,
      direction: 'IN',
      status: 'IN_TRANSIT',
      remark: n.remark,
    } as any)
  }
  // Increase in-transit for pending items
  if ((payload.status || 'PENDING') === 'PENDING') {
    for (const it of items) {
      await adjustProductInTransit(it.productId, it.qty)
    }
  }
  return ref.id
}

export async function updateInboundNotice(id: ID, n: Partial<InboundNotice>): Promise<void> {
  const current = await getInboundNotice(id)
  if (!current) throw new Error('入库预告不存在')

  let payloadBase: any = { ...n }
  let nextItems = current.items || []
  if (n.items) {
    const items = (n.items || []).filter((it: any) => it && it.productId && it.qty > 0)
    if (!items.length) throw new Error('请至少保留一条将要到货的货品，数量需大于0')
    payloadBase.items = items
    nextItems = items as any
  }
  const nextStatus = (n.status ?? current.status) as 'ARRIVED' | 'PENDING'

  // Adjust in-transit according to items and status transitions
  const sumByProduct = (arr: any[]) => {
    const map: Record<string, number> = {}
    for (const it of arr || []) {
      if (!it || !it.productId || !(it.qty > 0)) continue
      map[it.productId] = (map[it.productId] || 0) + Number(it.qty)
    }
    return map
  }

  if (current.status === 'PENDING' && nextStatus === 'PENDING') {
    const prevMap = sumByProduct(current.items || [])
    const nextMap = sumByProduct(nextItems || [])
    const productIds = new Set([...Object.keys(prevMap), ...Object.keys(nextMap)])
    for (const pid of productIds) {
      const delta = (nextMap[pid] || 0) - (prevMap[pid] || 0)
      if (delta !== 0) await adjustProductInTransit(pid, delta)
    }
  } else if (current.status === 'PENDING' && nextStatus === 'ARRIVED') {
    const prevMap = sumByProduct(current.items || [])
    for (const pid of Object.keys(prevMap)) {
      const qty = prevMap[pid]
      if (qty > 0) await adjustProductInTransit(pid, -qty)
    }
  } else if (current.status === 'ARRIVED' && nextStatus === 'PENDING') {
    const nextMap = sumByProduct(nextItems || [])
    for (const pid of Object.keys(nextMap)) {
      const qty = nextMap[pid]
      if (qty > 0) await adjustProductInTransit(pid, qty)
    }
  }

  const payload = stripUndefinedDeep({ ...payloadBase, updatedAt: serverTimestamp() })
  await updateDoc(doc(db, COL, id), payload)

  if (n.trackingUrl !== undefined) {
    if (n.trackingUrl) {
      await upsertPackageByRelation('InboundNotice', id, {
        trackingUrl: n.trackingUrl,
        direction: 'IN',
        status: 'IN_TRANSIT',
        remark: n.remark,
      } as any)
    } else {
      const pkg = await getPackageByRelation('InboundNotice', id)
      if (pkg?.id) await deletePackage(pkg.id)
    }
  }
}

export async function deleteInboundNotice(id: ID): Promise<void> {
  const current = await getInboundNotice(id)
  if (current && current.status === 'PENDING') {
    for (const it of current.items || []) {
      if (!it || !it.productId || !(it.qty > 0)) continue
      await adjustProductInTransit(it.productId, -it.qty)
    }
  }
  await deleteDoc(doc(db, COL, id))
  const pkg = await getPackageByRelation('InboundNotice', id)
  if (pkg?.id) await deletePackage(pkg.id)
}

// Confirm arrival: create stock-in records, adjust stock, and lock the notice
export async function confirmInboundArrival(id: ID, lines?: { productId: ID; qty: number; remark?: string }[], opts?: { remark?: string; signedBy?: string; arrivedAt?: any }): Promise<void> {
  const current = await getInboundNotice(id)
  if (!current) throw new Error('入库预告不存在')
  if (current.locked || current.status === 'ARRIVED') throw new Error('该预告已到货')

  const items = (lines && lines.length ? lines : current.items || []).filter((it: any) => it && it.productId && it.qty > 0)
  if (!items.length) throw new Error('没有可入库的货品条目')

  const at = opts?.arrivedAt ? opts.arrivedAt : new Date()
  const idSuffix = String(id || '').slice(-4)
  const autoRemark = `${(current.vendor || '').trim()}${idSuffix}`
  for (const it of items) {
    await createStockRecord({
      productId: it.productId,
      type: 'IN',
      qty: it.qty,
      at,
      remark: autoRemark,
      relatedType: 'InboundNotice',
      relatedId: id,
    })
    // Decrease in-transit if previously pending
    if (current.status === 'PENDING') {
      await adjustProductInTransit(it.productId, -it.qty)
    }
    await adjustProductStock(it.productId, it.qty)
  }

  // Update package status if exists
  const pkg = await getPackageByRelation('InboundNotice', id)
  if (pkg?.id) {
    await upsertPackageByRelation('InboundNotice', id, { ...pkg, status: 'DELIVERED' } as any)
  }

  const payload = stripUndefinedDeep({
    status: 'ARRIVED',
    arrivedAt: opts?.arrivedAt ?? serverTimestamp(),
    signedBy: opts?.signedBy,
    remark: opts?.remark,
    locked: true,
    updatedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, COL, id), payload)
}
