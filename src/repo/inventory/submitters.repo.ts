import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, stripUndefinedDeep } from '@/utils/firebase'
import type { ID } from './types'
import { COLLECTIONS } from '@/repo/config'

const COL = COLLECTIONS.SUBMITTERS

export interface Submitter { id?: ID; name: string; isActive?: boolean; createdAt?: any; updatedAt?: any }

export async function listSubmitters(): Promise<Submitter[]> {
  const snap = await getDocs(query(collection(db, COL)))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Submitter[]
}

export async function isSubmitterNameTaken(name: string, excludeId?: ID): Promise<boolean> {
  const norm = (name || '').trim().toLowerCase()
  if (!norm) return false
  const snap = await getDocs(query(collection(db, COL)))
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .some((v: any) => (v.name || '').trim().toLowerCase() === norm && (!excludeId || v.id !== excludeId))
}

export async function createSubmitter(v: Omit<Submitter, 'id' | 'createdAt' | 'updatedAt'>): Promise<ID> {
  const name = (v.name || '').trim()
  if (!name) throw new Error('提交人名称必填')
  if (await isSubmitterNameTaken(name)) return (await ensureSubmitter(name))!
  const payload = stripUndefinedDeep({
    name,
    isActive: v.isActive ?? true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const ref = await addDoc(collection(db, COL), payload)
  return ref.id
}

export async function updateSubmitter(id: ID, v: Partial<Submitter>): Promise<void> {
  const payload = stripUndefinedDeep({ ...v, updatedAt: serverTimestamp() })
  await updateDoc(doc(db, COL, id), payload)
}

export async function deleteSubmitter(id: ID): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}

// Ensure a submitter exists by name (case-insensitive). Returns ID if created or found.
export async function ensureSubmitter(name: string): Promise<ID | undefined> {
  const norm = (name || '').trim().toLowerCase()
  if (!norm) return undefined
  const all = await listSubmitters()
  const found = all.find(v => (v.name || '').trim().toLowerCase() === norm)
  if (found?.id) return found.id
  return await createSubmitter({ name })
}
