import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, stripUndefinedDeep } from '@/utils/firebase'
import type { Bom, ID } from './types'
import { COLLECTIONS } from '@/repo/config'

const COL = COLLECTIONS.BOMS

export async function listBoms(): Promise<Bom[]> {
  const snap = await getDocs(query(collection(db, COL)))
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Bom[]
}

export async function getBom(id: ID): Promise<Bom | undefined> {
  const ref = doc(db, COL, id)
  const d = await getDoc(ref)
  return d.exists() ? ({ id: d.id, ...(d.data() as any) } as Bom) : undefined
}

export async function createBom(b: Omit<Bom, 'id' | 'createdAt' | 'updatedAt'>): Promise<ID> {
  const payload = stripUndefinedDeep({
    ...b,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const ref = await addDoc(collection(db, COL), payload)
  return ref.id
}

export async function updateBom(id: ID, b: Partial<Bom>): Promise<void> {
  const ref = doc(db, COL, id)
  const payload = stripUndefinedDeep({ ...b, updatedAt: serverTimestamp() })
  await updateDoc(ref, payload)
}

export async function deleteBom(id: ID): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
