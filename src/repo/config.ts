// Centralized Firestore collection names
// Keep all collection identifiers here for easier management/refactors.
// Usage: import { COLLECTIONS } from '@/repo/config'
// Then use COLLECTIONS.SALES_ORDERS, etc.

export const COLLECTIONS = {
  SALES_ORDERS: 'salesOrders',
  PRODUCTS: 'inventory-products',
  INBOUND_NOTICES: 'inventory-inbound-notices',
  STOCK_RECORDS: 'stockRecords',
  BOMS: 'boms',
  SUBMITTERS: 'inventory-submitters',
  VENDORS: 'inventory-vendors',
  PACKAGES: 'inventory-packages',
  STOCKTAKES: 'inventory-stocktakes',
} as const

export type CollectionKey = keyof typeof COLLECTIONS
