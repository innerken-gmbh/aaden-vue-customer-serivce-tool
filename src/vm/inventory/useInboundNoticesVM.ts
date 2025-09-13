import { ref } from 'vue'
import type { ID, InboundNotice } from '@/repo/inventory/types'
import { createInboundNotice, deleteInboundNotice, getInboundNotice, listInboundNotices, updateInboundNotice, confirmInboundArrival } from '@/repo/inventory/inbound-notices.repo'

export function useInboundNoticesVM() {
  const loading = ref(false)
  const items = ref<InboundNotice[]>([])
  const error = ref<string | null>(null)

  const editing = ref<InboundNotice | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      items.value = await listInboundNotices()
    } catch (e: any) {
      error.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }

  async function edit(id: ID) {
    loading.value = true
    try {
      editing.value = id ? (await getInboundNotice(id)) || null : null
    } catch (e: any) {
      error.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }

  async function save(payload: Omit<InboundNotice, 'id' | 'createdAt' | 'updatedAt' | 'locked'> & { id?: ID }) {
    if (!payload.vendor) throw new Error('供应商必填')
    if (!payload.eta) throw new Error('预计到货时间必填')
    loading.value = true
    try {
      if (payload.id) {
        await updateInboundNotice(payload.id, payload)
      } else {
        await createInboundNotice(payload)
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
      await deleteInboundNotice(id)
      await load()
    } finally {
      loading.value = false
    }
  }

  // Confirm arrival with provided lines; remark optional
  async function confirmArrival(id: ID, lines: { productId: ID; qty: number; remark?: string }[], remark?: string) {
    loading.value = true
    try {
      await confirmInboundArrival(id, lines, { remark })
      await load()
    } finally {
      loading.value = false
    }
  }

  return { loading, items, error, editing, load, edit, save, remove, confirmArrival }
}

export default useInboundNoticesVM
