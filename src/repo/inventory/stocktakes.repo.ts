import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db, stripUndefinedDeep } from '@/utils/firebase'
import type { ID, Stocktake } from './types'
import { COLLECTIONS } from '@/repo/config'

const COL = COLLECTIONS.STOCKTAKES

export async function createStocktake(r: Omit<Stocktake, 'id' | 'createdAt' | 'updatedAt'>): Promise<ID> {
  const payload = stripUndefinedDeep({
    ...r,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const ref = await addDoc(collection(db, COL), payload)
  return ref.id
}

export async function listStocktakes(): Promise<Stocktake[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy('at', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Stocktake[]
}

export async function getStocktake(id: ID): Promise<Stocktake | undefined> {
  const d = await getDoc(doc(db, COL, id))
  return d.exists() ? ({ id: d.id, ...(d.data() as any) } as Stocktake) : undefined
}
