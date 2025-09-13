import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, Timestamp, where } from 'firebase/firestore'
import { db, stripUndefinedDeep } from '@/utils/firebase'
import type { ID, StockRecord } from './types'
import { COLLECTIONS } from '@/repo/config'

const COL = COLLECTIONS.STOCK_RECORDS

export async function createStockRecord(r: Omit<StockRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ID> {
  const payload = stripUndefinedDeep({
    ...r,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const ref = await addDoc(collection(db, COL), payload)
  return ref.id
}

export interface StockRecordFilter {
  productId?: ID
  startAt?: any
  endAt?: any
  type?: 'IN' | 'OUT'
}

export async function listStockRecords(filter: StockRecordFilter = {}): Promise<StockRecord[]> {
  const col = collection(db, COL)
  let q: any = query(col, orderBy('at', 'desc'))
  const clauses: any[] = []
  if (filter.productId) clauses.push(where('productId', '==', filter.productId))
  if (filter.type) clauses.push(where('type', '==', filter.type))
  if (filter.startAt) clauses.push(where('at', '>=', filter.startAt))
  if (filter.endAt) clauses.push(where('at', '<=', filter.endAt))
  if (clauses.length) q = query(col, ...clauses, orderBy('at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as StockRecord[]
}
