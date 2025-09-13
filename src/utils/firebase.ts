import {
    collection,
    doc,
    type Firestore,
    increment as _increment,
    runTransaction as _runTransaction,
    serverTimestamp as _serverTimestamp,
    type Transaction,
} from 'firebase/firestore'
import { firebaseDB } from '@/old/utils/firebase'

export const db: Firestore = firebaseDB
export const serverTimestamp = _serverTimestamp
export const runTransaction = _runTransaction
export const increment = _increment
export { doc, collection }
export type { Transaction }

// Re-export utility to strip undefined keys for use across repos
export { stripUndefinedDeep } from './clean'
