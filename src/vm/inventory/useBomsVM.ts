import { computed, ref } from 'vue'
import type { ID, Bom, BomItem } from '@/repo/inventory/types'
import { listBoms, getBom, createBom, updateBom, deleteBom } from '@/repo/inventory/boms.repo'

export function useBomsVM() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const items = ref<Bom[]>([])
  const editing = ref<Bom | null>(null)

  // filters & pagination
  const keyword = ref<string>('')
  const page = ref<number>(1)
  const pageSize = ref<number>(10)

  // selection
  const selectedIds = ref<ID[]>([])

  async function load() {
    loading.value = true
    error.value = null
    try {
      items.value = await listBoms()
      // default sort: updatedAt desc
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
    page.value = 1
  }

  const filteredItems = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    let list = items.value.slice()
    if (kw) {
      list = list.filter((b) => (b.name || '').toLowerCase().includes(kw) || (b.remark || '').toLowerCase().includes(kw))
    }
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
    error.value = null
    try {
      editing.value = id ? (await getBom(id)) || null : ({ name: '', items: [], remark: '' } as any)
    } catch (e: any) {
      error.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }

  function normalizeItems(items: BomItem[]): BomItem[] {
    const map: Record<string, BomItem> = {}
    for (const it of items || []) {
      const pid = (it as any)?.productId
      const qty = Number((it as any)?.qty)
      if (!pid || !qty || qty <= 0) continue
      if (!map[pid]) {
        map[pid] = { productId: pid, qty, remark: it.remark }
      } else {
        map[pid].qty += qty
        // keep the first remark if exists
        if (!map[pid].remark && it.remark) map[pid].remark = it.remark
      }
    }
    return Object.values(map)
  }

  async function save(payload: Omit<Bom, 'id' | 'createdAt' | 'updatedAt'> & { id?: ID }) {
    if (!payload.name || !payload.name.trim()) throw new Error('请填写BOM名称')

    const normalizedItems = normalizeItems(payload.items || [])
    if (!normalizedItems.length) throw new Error('请至少添加一条物料，且数量需大于0')

    loading.value = true
    error.value = null
    try {
      if (payload.id) {
        await updateBom(payload.id, { ...payload, items: normalizedItems })
      } else {
        await createBom({ ...payload, items: normalizedItems } as any)
      }
      await load()
      editing.value = null
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
      await deleteBom(id)
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
        await deleteBom(id)
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
    page,
    pageSize,
    pageCount,
    total,
    filteredItems,
    pagedItems,
    // selection
    selectedIds,
    // actions
    load,
    edit,
    save,
    remove,
    batchRemove,
    applyFilter,
    resetFilter,
  }
}

export default useBomsVM
