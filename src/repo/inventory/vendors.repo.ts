import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, stripUndefinedDeep } from '@/utils/firebase'
import type { ID, Vendor } from './types'
import { COLLECTIONS } from '@/repo/config'

const COL = COLLECTIONS.VENDORS

export async function listVendors(): Promise<Vendor[]> {
  const snap = await getDocs(query(collection(db, COL)))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Vendor[]
}

export async function isVendorNameTaken(name: string, excludeId?: ID): Promise<boolean> {
  const norm = (name || '').trim().toLowerCase()
  if (!norm) return false
  const snap = await getDocs(query(collection(db, COL)))
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .some((v: any) => (v.name || '').trim().toLowerCase() === norm && (!excludeId || v.id !== excludeId))
}

export async function createVendor(v: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<ID> {
  const name = (v.name || '').trim()
  if (!name) throw new Error('供应商名称必填')
  if (await isVendorNameTaken(name)) return (await ensureVendor(name))!
  const payload = stripUndefinedDeep({
    name,
    isActive: v.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const ref = await addDoc(collection(db, COL), payload)
  return ref.id
}

export async function updateVendor(id: ID, v: Partial<Vendor>): Promise<void> {
  const payload = stripUndefinedDeep({ ...v, updatedAt: serverTimestamp() })
  await updateDoc(doc(db, COL, id), payload)
}

export async function deleteVendor(id: ID): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}

// Ensure a vendor exists by name (case-insensitive). Returns ID if created or found.
export async function ensureVendor(name: string): Promise<ID | undefined> {
  const norm = (name || '').trim().toLowerCase()
  if (!norm) return undefined
  const all = await listVendors()
  const found = all.find(v => (v.name || '').trim().toLowerCase() === norm)
  if (found?.id) return found.id
  return await createVendor({ name })
}
