import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db, stripUndefinedDeep } from '@/utils/firebase'
import type { ID, Package, PackageDirection, PackageRelatedType } from './types'
import { COLLECTIONS } from '@/repo/config'

const COL = COLLECTIONS.PACKAGES

export interface PackageFilter {
  direction?: PackageDirection
  relatedType?: PackageRelatedType
  relatedId?: ID
}

export async function createPackage(p: Omit<Package, 'id' | 'createdAt' | 'updatedAt'>): Promise<ID> {
  if (!p.trackingUrl) throw new Error('trackingUrl 必填')
  const payload = stripUndefinedDeep({
    ...p,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const ref = await addDoc(collection(db, COL), payload)
  return ref.id
}

export async function updatePackage(id: ID, p: Partial<Package>): Promise<void> {
  const payload = stripUndefinedDeep({
    ...p,
    updatedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, COL, id), payload)
}

export async function deletePackage(id: ID): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}

export async function listPackages(filter: PackageFilter = {}): Promise<Package[]> {
  const col = collection(db, COL)
  const clauses: any[] = []
  if (filter.direction) clauses.push(where('direction', '==', filter.direction))
  if (filter.relatedType) clauses.push(where('relatedType', '==', filter.relatedType))
  if (filter.relatedId) clauses.push(where('relatedId', '==', filter.relatedId))
  const q: any = clauses.length ? query(col, ...clauses) : query(col)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Package[]
}

export async function getPackageByRelation(relatedType: PackageRelatedType, relatedId: ID): Promise<Package | undefined> {
  const col = collection(db, COL)
  const q: any = query(col, where('relatedType', '==', relatedType), where('relatedId', '==', relatedId), limit(1))
  const snap = await getDocs(q)
  const docSnap = snap.docs[0]
  return docSnap ? ({ id: docSnap.id, ...(docSnap.data() as any) } as Package) : undefined
}

export async function upsertPackageByRelation(relatedType: PackageRelatedType, relatedId: ID, payload: Omit<Package, 'id' | 'createdAt' | 'updatedAt' | 'relatedType' | 'relatedId'>): Promise<ID> {
  const existing = await getPackageByRelation(relatedType, relatedId)
  if (existing) {
    await updatePackage(existing.id!, { ...payload, relatedType, relatedId })
    return existing.id!
  }
  return createPackage({ ...payload, relatedType, relatedId })
}
