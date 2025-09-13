import { ref } from 'vue'
import type { ID, StockRecord } from '@/repo/inventory/types'
import { listStockRecords, type StockRecordFilter } from '@/repo/inventory/stock-records.repo'

export function useStockRecordsVM() {
  const loading = ref(false)
  const items = ref<StockRecord[]>([])
  const error = ref<string | null>(null)

  const filter = ref<StockRecordFilter>({})

  async function search(f?: StockRecordFilter) {
    loading.value = true
    error.value = null
    try {
      if (f) filter.value = f
      items.value = await listStockRecords(filter.value)
    } catch (e: any) {
      error.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }

  return { loading, items, error, filter, search }
}

export default useStockRecordsVM
