// Inventory domain types
export type ID = string

export interface BaseDoc {
  id?: ID
  createdAt?: any
  updatedAt?: any
  createdBy?: string
  updatedBy?: string
}

export interface Product extends BaseDoc {
  code: string
  name: string
  remark?: string
  stock?: number
  reservedStock?: number
  inTransit?: number
  isActive?: boolean
}

export interface BomItem {
  productId: ID
  qty: number
  remark?: string
}

export interface Bom extends BaseDoc {
  name: string
  items: BomItem[]
  remark?: string
}

export type StockType = 'IN' | 'OUT'

export interface StockRecord extends BaseDoc {
  productId: ID
  type: StockType
  qty: number
  at: any
  remark?: string
  relatedType?: 'InboundNotice' | 'SalesOrder' | 'Manual'
  relatedId?: ID
}

export interface InboundItem {
  productId: ID
  qty: number
  remark?: string
}

export interface InboundNotice extends BaseDoc {
  eta: any
  vendor: string
  submitter?: string
  trackingUrl?: string
  status: 'ARRIVED' | 'PENDING'
  items: InboundItem[]
  remark?: string
  locked?: boolean
  arrivedAt?: any
  signedBy?: string
}

export interface SalesOrderItem {
  productId: ID
  qty: number
  remark?: string
}

export interface SalesOrder extends BaseDoc {
  name?: string
  customerCode: string
  billNo: string
  submitter?: string
  items: SalesOrderItem[]
  remark?: string
  configRequirements?: string
  shipAddress?: string
  expectedShipAt?: any
  shippedAt?: any
  shipStatus: 'PENDING' | 'SHIPPED'
  shipTrackingUrls?: string
  mainDeviceCode?: string
  attachments?: string[]
  locked?: boolean
}

export type PackageDirection = 'IN' | 'OUT'
export type PackageRelatedType = 'InboundNotice' | 'SalesOrder'

export interface Package extends BaseDoc {
  trackingUrl: string
  direction: PackageDirection
  relatedType: PackageRelatedType
  relatedId: ID
  status?: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
  carrier?: string
  eta?: any
  arrivedAt?: any
  contents?: string
  remark?: string
}


// Vendor for inbound notices selection list
export interface Vendor extends BaseDoc {
  name: string
  isActive?: boolean
}
