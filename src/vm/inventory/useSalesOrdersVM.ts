import { ref } from 'vue'
import type { Bom, ID, SalesOrder, SalesOrderItem } from '@/repo/inventory/types'
import { createSalesOrder, deleteSalesOrder, getSalesOrder, listSalesOrders, updateSalesOrder, shipOrder } from '@/repo/inventory/sales-orders.repo'

export function useSalesOrdersVM() {
  const loading = ref(false)
  const items = ref<SalesOrder[]>([])
  const error = ref<string | null>(null)

  const editing = ref<SalesOrder | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      items.value = await listSalesOrders()
    } catch (e: any) {
      error.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }

  async function edit(id: ID) {
    loading.value = true
    try {
      editing.value = id ? (await getSalesOrder(id)) || null : null
    } catch (e: any) {
      error.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }

  function mergeFromBom(bom: Bom) {
    if (!editing.value) {
      editing.value = {
        id: undefined as any,
        name: '',
        customerCode: '',
        billNo: '',
        items: [],
        shipStatus: 'PENDING',
      }
    }
    const current = editing.value.items || []
    const map = new Map<string, SalesOrderItem>()
    for (const it of current) {
      map.set(it.productId, { ...it })
    }
    for (const bi of bom.items || []) {
      if (!bi.productId || !bi.qty || bi.qty <= 0) continue
      const ex = map.get(bi.productId)
      if (ex) {
        ex.qty += bi.qty
        map.set(bi.productId, ex)
      } else {
        map.set(bi.productId, { productId: bi.productId, qty: bi.qty })
      }
    }
    editing.value.items = Array.from(map.values())
  }

  async function save(payload: Omit<SalesOrder, 'id' | 'createdAt' | 'updatedAt' | 'shipStatus' | 'locked'> & { id?: ID; shipStatus?: SalesOrder['shipStatus'] }) {
    if (!payload.customerCode) throw new Error('客户名称必填')
    if (!payload.billNo) throw new Error('单据编号必填')
    if (!payload.items || payload.items.length === 0) throw new Error('订单至少包含一条明细')
    if (payload.items.some((i) => !i.productId || !i.qty || i.qty <= 0)) throw new Error('明细数量必须大于0')

    loading.value = true
    try {
      if (payload.id) {
        await updateSalesOrder(payload.id, payload)
      } else {
        await createSalesOrder({ ...payload, shipStatus: payload.shipStatus ?? 'PENDING' })
      }
      await load()
      editing.value = null
    } finally {
      loading.value = false
    }
  }

  async function remove(id: ID) {
    loading.value = true
    try {
      await deleteSalesOrder(id)
      await load()
    } finally {
      loading.value = false
    }
  }

  async function doShip(id: ID, pkgs: { trackingUrl: string; eta?: any; contents?: string; remark?: string }[]) {
    const list = (pkgs || []).filter(p => p && p.trackingUrl)
    if (!list.length) throw new Error('请至少填写一个包裹，并提供追踪链接')
    if (list.some(p => !/^https?:\/\//i.test(p.trackingUrl))) throw new Error('每个包裹的追踪链接必须以 http/https 开头')
    loading.value = true
    try {
      await shipOrder(id, list as any)
      await load()
    } finally {
      loading.value = false
    }
  }

  return { loading, items, error, editing, load, edit, save, remove, doShip, mergeFromBom }
}

export default useSalesOrdersVM
