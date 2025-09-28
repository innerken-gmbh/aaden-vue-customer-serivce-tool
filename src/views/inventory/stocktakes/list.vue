<template>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">库存管理 · 盘点记录</h1>
      <n-space>
        <n-button @click="load">刷新</n-button>
      </n-space>
    </div>

    <n-alert v-if="error" type="error" class="mt-3">{{ error }}</n-alert>

    <n-spin :show="loading" class="mt-4 w-full">
      <n-data-table :columns="columns" :data="items" :bordered="false" :row-key="rowKey" />
    </n-spin>

    <n-modal v-model:show="showDetail" preset="card" title="盘点详情" style="max-width: 900px">
      <div class="mb-2 text-gray-600">
        <div>盘点时间：{{ fmt(detail?.at) }}</div>
        <div>盘点人：{{ detail?.operator || '-' }}</div>
        <div>备注：{{ detail?.remark || '-' }}</div>
      </div>
      <n-data-table :columns="detailColumns" :data="detail?.items || []" :bordered="false" :row-key="(r:any)=>r.productId" />
    </n-modal>
  </div>
</template>
<script setup lang="ts">
import { NButton, NAlert, NSpin, NDataTable, NSpace, NModal } from 'naive-ui'
import { h, onMounted, ref } from 'vue'
import type { Stocktake } from '@/repo/inventory/types'
import { listStocktakes } from '@/repo/inventory/stocktakes.repo'

const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<Stocktake[]>([])

async function load() {
  loading.value = true
  error.value = null
  try {
    items.value = await listStocktakes()
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const rowKey = (row: any) => row.id

function fmt(dt: any) {
  if (!dt) return ''
  try {
    const ms = dt.seconds ? dt.seconds * 1000 : new Date(dt).getTime()
    const d = new Date(ms)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

const showDetail = ref(false)
const detail = ref<Stocktake | null>(null)

const columns = [
  { title: '盘点时间', key: 'at', render: (row: any) => fmt(row.at) },
  { title: '盘点人', key: 'operator' },
  { title: '备注', key: 'remark' },
  { title: '条目数', key: 'count', render: (row: any) => String((row.items || []).length) },
  {
    title: '操作',
    key: 'actions',
    render(row: any) {
      return h(NButton, { size: 'small', onClick: () => { detail.value = row; showDetail.value = true } }, { default: () => '查看详情' })
    },
  },
]

const detailColumns = [
  { title: '名称', key: 'name' },
  { title: '原库存', key: 'beforeQty' },
  { title: '盘点后', key: 'afterQty' },
  { title: '差异', key: 'diff', render: (row: any) => {
    const v = Number(row.diff || 0)
    const cls = v === 0 ? '' : (v > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold')
    return h('span', { class: cls }, String(v))
  } },
  { title: '备注', key: 'remark' },
]
</script>
