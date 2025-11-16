import { ref } from 'vue'
import type { Bom, ID, IntentOrder } from '@/repo/inventory/types'
import { createIntentOrder, deleteIntentOrder, getIntentOrder, listIntentOrders, updateIntentOrder, uploadAngebot, uploadPaymentProof, reviewAndExportToSalesOrder, markReceived, archiveIntent, closeIntent } from '@/repo/inventory/intent-orders.repo'

export function useIntentOrdersVM() {
  const loading = ref(false)
  const items = ref<IntentOrder[]>([])
  const error = ref<string | null>(null)

  const editing = ref<IntentOrder | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      items.value = await listIntentOrders()
    } catch (e: any) {
      error.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }

  async function edit(id: ID) {
    loading.value = true
    try {
      editing.value = id ? (await getIntentOrder(id)) || null : null
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
        items: [],
        remark: '',
        status: 'SUBMITTED',
      }
    }
    const current = editing.value.items || []
    const map = new Map<string, { productId: ID; qty: number; remark?: string }>()
    for (const it of current) map.set(it.productId, { ...it })
    for (const bi of bom.items || []) {
      if (!bi.productId || !bi.qty || bi.qty <= 0) continue
      const ex = map.get(bi.productId)
      if (ex) ex.qty += bi.qty
      else map.set(bi.productId, { productId: bi.productId, qty: bi.qty })
    }
    editing.value.items = Array.from(map.values()) as any
  }

  async function save(payload: Omit<IntentOrder, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'locked'> & { id?: ID; status?: IntentOrder['status'] }) {
    if (!payload.customerCode) throw new Error('客户名称必填')
    if (!payload.items || payload.items.length === 0) throw new Error('订单至少包含一条明细')
    if (payload.items.some((i) => !i.productId || !i.qty || i.qty <= 0)) throw new Error('明细数量必须大于0')

    loading.value = true
    try {
      if (payload.id) await updateIntentOrder(payload.id, payload as any)
      else await createIntentOrder({ ...payload, status: payload.status ?? 'SUBMITTED' })
      await load()
      editing.value = null
    } finally {
      loading.value = false
    }
  }

  async function remove(id: ID) {
    loading.value = true
    try {
      await deleteIntentOrder(id)
      await load()
    } finally {
      loading.value = false
    }
  }

  // 状态动作
  async function doUploadAngebot(id: ID, url: string, billNo?: string, originalName?: string) {
    loading.value = true
    try {
      await uploadAngebot(id, url, billNo, originalName)
      await load()
    } finally { loading.value = false }
  }

  async function doUploadPayment(id: ID, files: any[]) {
    loading.value = true
    try {
      await uploadPaymentProof(id, files as any)
      await load()
    } finally { loading.value = false }
  }

  async function doReviewAndExport(id: ID, amount: number) {
    loading.value = true
    try {
      await reviewAndExportToSalesOrder(id, amount)
      await load()
    } finally { loading.value = false }
  }

  async function doMarkReceived(id: ID) {
    loading.value = true
    try { await markReceived(id); await load() } finally { loading.value = false }
  }

  async function doArchive(id: ID) {
    loading.value = true
    try { await archiveIntent(id); await load() } finally { loading.value = false }
  }

  async function doClose(id: ID, reason: string) {
    loading.value = true
    try { await closeIntent(id, reason); await load() } finally { loading.value = false }
  }

  return { loading, items, error, editing, load, edit, save, remove, mergeFromBom, doUploadAngebot, doUploadPayment, doReviewAndExport, doMarkReceived, doArchive, doClose }
}

export default useIntentOrdersVM
