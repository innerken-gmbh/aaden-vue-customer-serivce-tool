import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, stripUndefinedDeep } from '@/utils/firebase'
import type { ID, IntentOrder, SalesOrder } from './types'
import { COLLECTIONS } from '@/repo/config'
import { createSalesOrder } from './sales-orders.repo'

const COL = COLLECTIONS.INTENT_ORDERS

export async function listIntentOrders(): Promise<IntentOrder[]> {
  const snap = await getDocs(query(collection(db, COL)))
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as IntentOrder[]
}

export async function getIntentOrder(id: ID): Promise<IntentOrder | undefined> {
  const d = await getDoc(doc(db, COL, id))
  return d.exists() ? ({ id: d.id, ...(d.data() as any) } as IntentOrder) : undefined
}

export async function createIntentOrder(o: Omit<IntentOrder, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'locked'> & { status?: IntentOrder['status']; locked?: boolean }): Promise<ID> {
  const payload = stripUndefinedDeep({
    ...o,
    status: o.status ?? 'SUBMITTED',
    locked: o.locked ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const ref = await addDoc(collection(db, COL), payload)
  return ref.id
}

export async function updateIntentOrder(id: ID, o: Partial<IntentOrder>): Promise<void> {
  const payload = stripUndefinedDeep({ ...o, updatedAt: serverTimestamp() })
  await updateDoc(doc(db, COL, id), payload)
}

export async function deleteIntentOrder(id: ID): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}

// 状态操作
export async function uploadAngebot(id: ID, url: string, quoteBillNo?: string, originalName?: string) {
  await updateIntentOrder(id, { angebotUrl: url, quoteBillNo, quoteOriginalName: originalName, status: 'QUOTED' })
}

export type PaymentFile = { url: string; name?: string }

export async function uploadPaymentProof(id: ID, files: string[] | PaymentFile[]) {
  // Accept legacy array of URLs or new array of objects
  const asObjects: PaymentFile[] = Array.isArray(files) && typeof files[0] === 'string'
    ? (files as string[]).filter(Boolean).map(u => ({ url: u }))
    : ((files as PaymentFile[]) || []).filter(f => !!f && !!f.url)

  // De-duplicate by URL
  const map = new Map<string, PaymentFile>()
  for (const f of asObjects) { if (!map.has(f.url)) map.set(f.url, f) }
  const uniqueObjs = Array.from(map.values())
  const urlList = uniqueObjs.map(f => f.url)
  await updateIntentOrder(id, { paymentProofUrls: urlList, paymentProofs: uniqueObjs, status: 'PAYMENT_UPLOADED' })
}

export async function reviewAndExportToSalesOrder(intentId: ID, reviewedAmount: number): Promise<ID> {
  const inOrder = await getIntentOrder(intentId)
  if (!inOrder) throw new Error('意向订单不存在')
  // 创建销售订单（不含发货信息）
  const soPayload: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt' | 'shipStatus' | 'locked'> = {
    name: inOrder.name,
    customerCode: inOrder.customerCode,
    billNo: inOrder.quoteBillNo || '',
    submitter: inOrder.submitter,
    items: (inOrder.items || []).map(it => ({ productId: it.productId, qty: it.qty, remark: it.remark })),
    remark: inOrder.remark,
    configRequirements: undefined,
    shipAddress: undefined,
    expectedShipAt: inOrder.expectedShipAt,
    shippedAt: undefined,
    shipTrackingUrls: undefined,
    arrivalStatus: undefined,
    mainDeviceCode: undefined,
    attachments: inOrder.attachments || [],
  }
  const salesOrderId = await createSalesOrder({ ...soPayload, shipStatus: 'PENDING', locked: false })
  await updateIntentOrder(intentId, { reviewedAmount, exportedSalesOrderId: salesOrderId, exportedFlag: true, status: 'EXPORTED' })
  return salesOrderId
}

export async function markReceived(intentId: ID) {
  await updateIntentOrder(intentId, { status: 'RECEIVED' })
}

export async function archiveIntent(intentId: ID) {
  await updateIntentOrder(intentId, { status: 'ARCHIVED', locked: true })
}

export async function closeIntent(intentId: ID, reason: string) {
  await updateIntentOrder(intentId, { status: 'CLOSED', closeReason: reason, locked: true })
}
