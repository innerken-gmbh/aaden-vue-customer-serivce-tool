import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, runTransaction, increment, stripUndefinedDeep } from '@/utils/firebase'
import type { ID, Product } from './types'
import { COLLECTIONS } from '@/repo/config'

const COL = COLLECTIONS.PRODUCTS

export async function listProducts(): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, COL)))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Product[]
}

export async function getProduct(id: ID): Promise<Product | undefined> {
  const d = await getDoc(doc(db, COL, id))
  return d.exists() ? ({ id: d.id, ...(d.data() as any) } as Product) : undefined
}

export async function isProductCodeTaken(code: string, excludeId?: ID): Promise<boolean> {
  const snap = await getDocs(query(collection(db, COL)))
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .some((p: any) => p.code === code && (!excludeId || p.id !== excludeId))
}

export async function createProduct(p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ID> {
  if (!p.code || !p.name) throw new Error('编号与名称必填')
  if (await isProductCodeTaken(p.code)) throw new Error('货物编号已存在')
  const payload = stripUndefinedDeep({
    ...p,
    stock: p.stock ?? 0,
    reservedStock: p.reservedStock ?? 0,
    inTransit: p.inTransit ?? 0,
    isActive: p.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const ref = await addDoc(collection(db, COL), payload)
  return ref.id
}

export async function updateProduct(id: ID, p: Partial<Product>): Promise<void> {
  if (p.code) {
    const taken = await isProductCodeTaken(p.code, id)
    if (taken) throw new Error('货物编号已存在')
  }
  const payload = stripUndefinedDeep({ ...p, updatedAt: serverTimestamp() })
  await updateDoc(doc(db, COL, id), payload)
}

export async function deleteProduct(id: ID): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}

// Adjust stock with transaction, prevent negative stock
export async function adjustProductStock(productId: ID, delta: number): Promise<void> {
  await runTransaction(db as any, async (tx: any) => {
    const ref = doc(db, COL, productId)
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('货品不存在')
    const cur = (snap.data()?.stock ?? 0) as number
    const next = cur + delta
    if (next < 0) throw new Error('库存不足')
    tx.update(ref, { stock: increment(delta), updatedAt: serverTimestamp() })
  })
}

// Adjust reserved stock with transaction, floor at 0 to avoid negative values
export async function adjustProductReserved(productId: ID, delta: number): Promise<void> {
  await runTransaction(db as any, async (tx: any) => {
    const ref = doc(db, COL, productId)
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('货品不存在')
    const cur = (snap.data()?.reservedStock ?? 0) as number
    const next = Math.max(0, cur + delta)
    tx.update(ref, { reservedStock: next, updatedAt: serverTimestamp() })
  })
}

// Adjust in-transit quantity; floors at 0
export async function adjustProductInTransit(productId: ID, delta: number): Promise<void> {
  await runTransaction(db as any, async (tx: any) => {
    const ref = doc(db, COL, productId)
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error('货品不存在')
    const cur = (snap.data()?.inTransit ?? 0) as number
    const next = Math.max(0, cur + delta)
    tx.update(ref, { inTransit: next, updatedAt: serverTimestamp() })
  })
}
