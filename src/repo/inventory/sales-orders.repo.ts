import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, stripUndefinedDeep } from '@/utils/firebase'
import type { ID, SalesOrder } from './types'
import { adjustProductStock, adjustProductReserved } from './products.repo'
import { createStockRecord } from './stock-records.repo'
import { COLLECTIONS } from '@/repo/config'

const COL = COLLECTIONS.SALES_ORDERS

export async function listSalesOrders(): Promise<SalesOrder[]> {
  const snap = await getDocs(query(collection(db, COL)))
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SalesOrder[]
}

export async function getSalesOrder(id: ID): Promise<SalesOrder | undefined> {
  const d = await getDoc(doc(db, COL, id))
  return d.exists() ? ({ id: d.id, ...(d.data() as any) } as SalesOrder) : undefined
}

export async function createSalesOrder(o: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt' | 'shipStatus' | 'locked'> & { shipStatus?: SalesOrder['shipStatus']; locked?: boolean }): Promise<ID> {
  const payload = stripUndefinedDeep({
    ...o,
    shipStatus: o.shipStatus ?? 'PENDING',
    locked: o.locked ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const ref = await addDoc(collection(db, COL), payload)
  // Increase reserved stock for each item if order is not shipped
  if ((payload.shipStatus ?? 'PENDING') !== 'SHIPPED') {
    for (const it of (o.items || [])) {
      if (!it || !it.productId || !it.qty || it.qty <= 0) continue
      await adjustProductReserved(it.productId, it.qty)
    }
  }
  return ref.id
}

export async function updateSalesOrder(id: ID, o: Partial<SalesOrder>): Promise<void> {
  const current = await getSalesOrder(id)
  if (current?.locked) throw new Error('已发货订单不可修改')

  // Compute reserved deltas only when items are provided and order remains unshipped
  const shouldAdjust = Array.isArray(o.items) && (current?.shipStatus !== 'SHIPPED')
  const deltas: Record<string, number> = {}
  if (shouldAdjust) {
    const oldMap: Record<string, number> = {}
    for (const it of (current?.items || [])) {
      if (!it || !it.productId || !it.qty) continue
      oldMap[it.productId] = (oldMap[it.productId] || 0) + it.qty
    }
    const newMap: Record<string, number> = {}
    for (const it of (o.items || [])) {
      if (!it || !it.productId || !it.qty) continue
      newMap[it.productId] = (newMap[it.productId] || 0) + it.qty
    }
    const ids = new Set<string>([...Object.keys(oldMap), ...Object.keys(newMap)])
    ids.forEach(pid => {
      const delta = (newMap[pid] || 0) - (oldMap[pid] || 0)
      if (delta !== 0) deltas[pid] = delta
    })
  }

  const payload = stripUndefinedDeep({ ...o, updatedAt: serverTimestamp() })
  await updateDoc(doc(db, COL, id), payload)

  if (shouldAdjust) {
    for (const [pid, delta] of Object.entries(deltas)) {
      await adjustProductReserved(pid, delta)
    }
  }
}

export async function deleteSalesOrder(id: ID): Promise<void> {
  const current = await getSalesOrder(id)
  if (current?.locked) throw new Error('已发货订单不可删除')
  // Decrease reserved stock if order was not shipped yet
  if (current && current.shipStatus !== 'SHIPPED') {
    for (const it of (current.items || [])) {
      if (!it || !it.productId || !it.qty || it.qty <= 0) continue
      await adjustProductReserved(it.productId, -it.qty)
    }
  }
  await deleteDoc(doc(db, COL, id))
}

export interface ShipPackageInput { trackingUrl: string; eta?: any; contents?: string; remark?: string }

export async function shipOrder(id: ID, pkgs: ShipPackageInput[]): Promise<void> {
  const packages = (pkgs || []).filter(p => p && p.trackingUrl)
  if (!packages.length) throw new Error('发货必须至少填写一个包裹，且包含追踪链接')
  const current = await getSalesOrder(id)
  if (!current) throw new Error('订单不存在')
  if (current.locked || current.shipStatus === 'SHIPPED') throw new Error('订单已发货')

  // For each item, reduce reserved then write OUT record and reduce stock
  for (const it of current.items || []) {
    if (!it || it.qty <= 0) continue
    await adjustProductReserved(it.productId, -it.qty)
    const idSuffix = String(id || '').slice(-4)
    const autoRemark = `${(current.billNo || '').trim()}${idSuffix}`
    await createStockRecord({
      productId: it.productId,
      type: 'OUT',
      qty: it.qty,
      at: new Date(),
      remark: autoRemark,
      relatedType: 'SalesOrder',
      relatedId: id,
    })
    await adjustProductStock(it.productId, -it.qty)
  }

  // Create package records
  for (const p of packages) {
    await addDoc(collection(db, COLLECTIONS.PACKAGES), stripUndefinedDeep({
      trackingUrl: p.trackingUrl,
      direction: 'OUT',
      relatedType: 'SalesOrder',
      relatedId: id,
      status: 'IN_TRANSIT',
      eta: p.eta,
      contents: p.contents,
      remark: p.remark,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
  }

  const payload = stripUndefinedDeep({
    shipStatus: 'SHIPPED',
    shipTrackingUrls: undefined,
    arrivalStatus: 'PENDING',
    shippedAt: serverTimestamp(),
    locked: true,
    updatedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, COL, id), payload)
}
