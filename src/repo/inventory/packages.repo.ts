import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, serverTimestamp, updateDoc, where, orderBy } from 'firebase/firestore'
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

async function checkSalesOrderArrival(soId: ID) {
  try {
    const snap = await getDocs(query(collection(db, COL), where('relatedType', '==', 'SalesOrder'), where('relatedId', '==', soId)))
    const list = snap.docs.map(d => d.data() as any)
    if (!list.length) return // no packages
    const allDelivered = list.every(x => (x.status || 'IN_TRANSIT') === 'DELIVERED')
    const orderRef = doc(db, COLLECTIONS.SALES_ORDERS, soId)
    await updateDoc(orderRef, stripUndefinedDeep({ arrivalStatus: allDelivered ? 'ARRIVED' : 'PENDING', updatedAt: serverTimestamp() }))
  } catch (e) {
    // ignore
  }
}

export async function updatePackage(id: ID, p: Partial<Package>): Promise<void> {
  const payload = stripUndefinedDeep({
    ...p,
    updatedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, COL, id), payload)
  if (p.status === 'DELIVERED') {
    // fetch package to know relation
    try {
      const d = await getDocs(query(collection(db, COL), where('__name__', '==', id), limit(1)))
      const docSnap = d.docs[0]
      const data: any = docSnap?.data()
      if (data?.relatedType === 'SalesOrder' && data?.relatedId) {
        await checkSalesOrderArrival(data.relatedId)
      }
    } catch {}
  }
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
  const q: any = clauses.length ? query(col, ...clauses, orderBy('createdAt', 'desc')) : query(col, orderBy('createdAt', 'desc'))
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
