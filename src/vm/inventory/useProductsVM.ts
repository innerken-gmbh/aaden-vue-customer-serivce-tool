import { computed, ref } from 'vue'
import type { ID, Product } from '@/repo/inventory/types'
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, adjustProductStock } from '@/repo/inventory/products.repo'
import { createStockRecord } from '@/repo/inventory/stock-records.repo'

export function useProductsVM() {
  const loading = ref(false)
  const items = ref<Product[]>([])
  const error = ref<string | null>(null)

  // editing form
  const editing = ref<Product | null>(null)

  // filters and pagination
  const keyword = ref<string>('')
  const stockMin = ref<number | null>(null)
  const stockMax = ref<number | null>(null)
  const page = ref<number>(1)
  const pageSize = ref<number>(10)

  // selection for batch actions
  const selectedIds = ref<ID[]>([])

  async function load() {
    loading.value = true
    error.value = null
    try {
      items.value = await listProducts()
      // default sort by updatedAt desc
      items.value.sort((a: any, b: any) => {
        const ta = (a.updatedAt && (a.updatedAt.seconds ? a.updatedAt.seconds * 1000 : new Date(a.updatedAt).getTime())) || 0
        const tb = (b.updatedAt && (b.updatedAt.seconds ? b.updatedAt.seconds * 1000 : new Date(b.updatedAt).getTime())) || 0
        return tb - ta
      })
    } catch (e: any) {
      error.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }

  function applyFilter() {
    page.value = 1
  }
  function resetFilter() {
    keyword.value = ''
    stockMin.value = null
    stockMax.value = null
    page.value = 1
  }

  const filteredItems = computed(() => {
    let list = items.value.slice()
    const kw = keyword.value.trim().toLowerCase()
    if (kw) {
      list = list.filter((p) => (p.code || '').toLowerCase().includes(kw) || (p.name || '').toLowerCase().includes(kw))
    }
    if (stockMin.value != null) list = list.filter((p) => (p.stock || 0) >= (stockMin.value as number))
    if (stockMax.value != null) list = list.filter((p) => (p.stock || 0) <= (stockMax.value as number))
    return list
  })

  const total = computed(() => filteredItems.value.length)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const pagedItems = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return filteredItems.value.slice(start, start + pageSize.value)
  })

  async function edit(id?: ID) {
    loading.value = true
    try {
      editing.value = id ? (await getProduct(id)) || null : { code: '', name: '', remark: '', stock: 0, isActive: true }
    } catch (e: any) {
      error.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }

  async function save(payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: ID }) {
    if (!payload.code) throw new Error('编号必填')
    if (!payload.name) throw new Error('名称必填')
    if (payload.stock != null && payload.stock < 0) throw new Error('库存不能为负数')

    loading.value = true
    error.value = null
    try {
      if (payload.id) {
        await updateProduct(payload.id, payload)
      } else {
        await createProduct(payload)
      }
      await load()
      editing.value = null
    } catch (e: any) {
      const msg = e?.message || String(e)
      error.value = msg
      throw e
    } finally {
      loading.value = false
    }
  }

  async function adjust(productId: ID, type: 'IN' | 'OUT', qty: number, remark?: string) {
    if (!productId) throw new Error('缺少货品ID')
    if (!qty || qty <= 0) throw new Error('数量必须大于0')
    loading.value = true
    error.value = null
    try {
      // 先写库存操作记录
      await createStockRecord({
        productId,
        type,
        qty,
        at: new Date(),
        remark: remark || (type === 'IN' ? '手动入库' : '手动出库'),
        relatedType: 'Manual',
        relatedId: productId,
      } as any)
      // 再调整产品库存（事务防止并发负库存）
      const delta = type === 'IN' ? qty : -qty
      await adjustProductStock(productId, delta)
      await load()
    } catch (e: any) {
      error.value = e?.message || String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: ID) {
    loading.value = true
    error.value = null
    try {
      await deleteProduct(id)
      await load()
    } catch (e: any) {
      error.value = e?.message || String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function batchRemove(ids: ID[]) {
    if (!ids.length) return
    loading.value = true
    error.value = null
    try {
      for (const id of ids) {
        await deleteProduct(id)
      }
      selectedIds.value = []
      await load()
    } catch (e: any) {
      error.value = e?.message || String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    // state
    loading,
    error,
    items,
    editing,
    // filters
    keyword,
    stockMin,
    stockMax,
    page,
    pageSize,
    pageCount,
    total,
    filteredItems,
    pagedItems,
    selectedIds,
    // actions
    load,
    edit,
    save,
    remove,
    adjust,
    batchRemove,
    applyFilter,
    resetFilter,
  }
}
export default useProductsVM
