<template>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">库存管理 · 包裹列表</h1>
      <n-space>
        <n-button @click="load" :loading="loading">刷新</n-button>
      </n-space>
    </div>

    <div class="mt-3 flex flex-wrap items-end justify-between gap-3">
      <n-space align="end" item-style="display: flex; align-items: end; gap: 8px;">
        <n-select v-model:value="direction" :options="directionOptions" placeholder="方向" clearable style="width: 140px" />
        <n-select v-model:value="relatedType" :options="relatedTypeOptions" placeholder="来源类型" clearable style="width: 160px" />
        <n-button @click="applyFilter" :loading="loading">搜索</n-button>
        <n-button @click="onClear" :disabled="loading">清空</n-button>
      </n-space>
      <n-space>
        <!-- 占位 -->
      </n-space>
    </div>

    <n-alert v-if="error" type="error" class="mt-3">{{ error }}</n-alert>

    <n-spin :show="loading" class="mt-4 w-full">
      <n-data-table :columns="columns" :data="pagedItems" :bordered="false" :row-key="rowKey" />
    </n-spin>

    <div class="mt-3 flex justify-end">
      <n-pagination v-model:page="page" :page-size="pageSize" :page-count="pageCount" :page-slot="7" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { NButton, NAlert, NSpin, NDataTable, NSpace, NSelect, NPagination } from 'naive-ui'
import { computed, h, onMounted, ref } from 'vue'
import { listPackages } from '@/repo/inventory/packages.repo'

const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<any[]>([])

const direction = ref<'IN' | 'OUT' | undefined>()
const relatedType = ref<'InboundNotice' | 'SalesOrder' | undefined>()

const directionOptions = [
  { label: '入库', value: 'IN' },
  { label: '出库', value: 'OUT' },
]
const relatedTypeOptions = [
  { label: '入库预告', value: 'InboundNotice' },
  { label: '销售订单', value: 'SalesOrder' },
]

async function load() {
  loading.value = true
  error.value = null
  try {
    const filter: any = {}
    if (direction.value) filter.direction = direction.value
    if (relatedType.value) filter.relatedType = relatedType.value
    items.value = await listPackages(filter)
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

function applyFilter() { page.value = 1; load() }
function onClear() { direction.value = undefined; relatedType.value = undefined; page.value = 1; load() }

onMounted(load)

const page = ref(1)
const pageSize = ref(10)
const pageCount = computed(() => Math.max(1, Math.ceil((items.value?.length || 0) / pageSize.value)))
const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return (items.value || []).slice(start, start + pageSize.value)
})

const rowKey = (row: any) => row.id

function fmt(dt: any) {
  if (!dt) return ''
  try {
    const ms = dt?.seconds ? dt.seconds * 1000 : new Date(dt).getTime()
    const d = new Date(ms)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

const columns = computed(() => [
  { title: '追踪链接', key: 'trackingUrl', render: (row: any) => row.trackingUrl ? h('a', { href: row.trackingUrl, target: '_blank', class: 'text-blue-600' }, row.trackingUrl) : '-' },
  { title: '方向', key: 'direction', render: (row: any) => row.direction === 'IN' ? '入库' : '出库' },
  { title: '来源', key: 'relatedType', render: (row: any) => `${row.relatedType || '-'}#${row.relatedId || ''}` },
  { title: '状态', key: 'status' },
  { title: '备注', key: 'remark' },
  { title: '创建于', key: 'createdAt', render: (row: any) => fmt(row.createdAt) },
])
</script>
