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
  arrivalStatus?: 'PENDING' | 'ARRIVED'
  mainDeviceCode?: string
  attachments?: string[]
  locked?: boolean
}

// Intent Orders
export type IntentOrderStatus =
  | 'SUBMITTED'          // 销售提交
  | 'QUOTED'             // 财务已开具报价(Angebot)
  | 'PAYMENT_UPLOADED'   // 销售已上传付款证明
  | 'EXPORTED'           // 已导出/创建销售订单
  | 'RECEIVED'           // 财务确认到账
  | 'ARCHIVED'           // 已归档
  | 'CLOSED'             // 已关闭（未付款等）

export interface IntentOrderItem {
  productId: ID
  qty: number
  remark?: string
}

export interface IntentOrder extends BaseDoc {
  name?: string
  customerCode: string
  submitter?: string
  items: IntentOrderItem[]
  remark?: string
  expectedShipAt?: any
  attachments?: string[]
  status: IntentOrderStatus
  // 报价/付款/导出相关
  angebotUrl?: string
  quoteBillNo?: string
  // 原始文件名（更友好展示）
  quoteOriginalName?: string
  paymentProofUrls?: string[]
  // 新结构：保存每个付款凭证的 url 与原始文件名（向下兼容旧的 paymentProofUrls）
  paymentProofs?: { url: string; name?: string }[]
  reviewedAmount?: number
  exportedSalesOrderId?: ID | null
  exportedFlag?: boolean
  // 关闭
  closeReason?: string
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
  arrivedBy?: string
  contents?: string
  remark?: string
}

export interface StocktakeItem {
  productId: ID
  name?: string
  beforeQty: number
  afterQty: number
  diff: number
  remark?: string
}

export interface Stocktake extends BaseDoc {
  at: any
  operator?: string
  remark?: string
  items: StocktakeItem[]
}

// Vendor for inbound notices selection list
export interface Vendor extends BaseDoc {
  name: string
  isActive?: boolean
}
