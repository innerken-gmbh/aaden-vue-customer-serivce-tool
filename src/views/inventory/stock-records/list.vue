<template>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">库存管理 · 库存记录</h1>
      <n-space>
        <n-button @click="onRefresh" :loading="loading">刷新</n-button>
      </n-space>
    </div>

    <div class="mt-3 flex flex-wrap items-end justify-between gap-3">
      <n-space align="end" item-style="display: flex; align-items: end; gap: 8px;">
        <n-select
          v-model:value="ui.productId"
          :options="productOptions"
          placeholder="选择货品"
          clearable
          style="width: 240px"
        />
        <n-select
          v-model:value="ui.type"
          :options="typeOptions"
          placeholder="类型"
          clearable
          style="width: 140px"
        />
        <n-button @click="applyFilter" :loading="loading">搜索</n-button>
        <n-button @click="onClear" :disabled="loading">清空</n-button>
      </n-space>
      <n-space>
        <!-- 预留批量操作位（本页暂无） -->
      </n-space>
    </div>

    <n-alert v-if="error" type="error" class="mt-3">{{ error }}</n-alert>

    <n-spin :show="loading" class="mt-4 w-full">
      <n-data-table
        :columns="columns"
        :data="pagedItems"
        :bordered="false"
        :row-key="rowKey"
      />
    </n-spin>

    <div class="mt-3 flex justify-end">
      <n-pagination v-model:page="page" :page-size="pageSize" :page-count="pageCount" :page-slot="7" />
    </div>

    <!-- 详情弹窗 -->
    <n-modal v-model:show="showDetail" preset="card" title="记录详情" style="max-width: 640px">
      <div class="space-y-4">
        <div>
          <div class="text-gray-500 mb-2">货品信息</div>
          <n-descriptions bordered :column="2" label-placement="left" size="small">
            <n-descriptions-item label="编号">
              {{ detailProduct?.code || '-' }}
            </n-descriptions-item>
            <n-descriptions-item label="名称">
              {{ detailProduct?.name || '-' }}
            </n-descriptions-item>
            <n-descriptions-item label="当前库存">
              {{ detailProduct?.stock ?? '-' }}
            </n-descriptions-item>
            <n-descriptions-item label="启用">
              {{ detailProduct ? (detailProduct.isActive ? '是' : '否') : '-' }}
            </n-descriptions-item>
            <n-descriptions-item label="备注" :span="2">
              {{ detailProduct?.remark || '-' }}
            </n-descriptions-item>
          </n-descriptions>
        </div>

        <div>
          <div class="text-gray-500 mb-2">记录信息</div>
          <n-descriptions bordered :column="2" label-placement="left" size="small">
            <n-descriptions-item label="类型">
              <n-tag :type="detailRecord?.type === 'IN' ? 'success' : (detailRecord?.type === 'OUT' ? 'error' : undefined)" size="small">
                {{ detailRecord?.type === 'IN' ? '入库' : (detailRecord?.type === 'OUT' ? '出库' : '-') }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="数量">
              {{ detailRecord?.qty ?? '-' }}
            </n-descriptions-item>
            <n-descriptions-item label="发生时间">
              {{ fmt(detailRecord?.at) }}
            </n-descriptions-item>
            <n-descriptions-item label="关联">
              {{ [detailRecord?.relatedType, detailRecord?.relatedId].filter(Boolean).join('#') || '-' }}
            </n-descriptions-item>
            <n-descriptions-item label="备注" :span="2">
              {{ detailRecord?.remark || '-' }}
            </n-descriptions-item>
          </n-descriptions>
        </div>
      </div>
    </n-modal>
  </div>
</template>
<script setup lang="ts">
import { NButton, NAlert, NSpin, NDataTable, NSpace, NSelect, NDatePicker, NPagination, NModal, NTag } from 'naive-ui'
import { computed, onMounted, reactive, ref, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStockRecordsVM } from '@/vm/inventory/useStockRecordsVM'
import { listProducts } from '@/repo/inventory/products.repo'
import type { Product } from '@/repo/inventory/types'

const route = useRoute()
const router = useRouter()

const { loading, error, items, filter, search } = useStockRecordsVM()

// UI state for filters and pagination
const ui = reactive<{ productId?: string; type?: 'IN' | 'OUT' | undefined }>({
  productId: undefined,
  type: undefined,
})

const page = ref(1)
const pageSize = ref(50)

function toMillis(v: any): number {
  if (!v) return 0
  if (typeof v === 'number') return v
  if ((v as any)?.toMillis) return (v as any).toMillis()
  if ((v as any)?.seconds) return (v as any).seconds * 1000
  const t = new Date(v).getTime()
  return isNaN(t) ? 0 : t
}

const sortedItems = computed(() => {
  const list = (items.value || []).slice()
  // 默认按创建时间倒序
  list.sort((a: any, b: any) => toMillis(b.createdAt) - toMillis(a.createdAt))
  return list
})

const pageCount = computed(() => Math.max(1, Math.ceil((sortedItems.value?.length || 0) / pageSize.value)))
const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sortedItems.value.slice(start, start + pageSize.value)
})

function rowKey(row: any) {
  return row.id
}

// Load products for filter & display mapping
const products = ref<Product[]>([])
const productMap = computed<Record<string, Product>>(() => Object.fromEntries(products.value.map(p => [p.id!, p])))
const productOptions = computed(() => products.value.map(p => ({ label: `${p.code} · ${p.name}`, value: p.id! })))

const typeOptions = [
  { label: '入库', value: 'IN' },
  { label: '出库', value: 'OUT' },
]

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

// 详情弹窗状态
const showDetail = ref(false)
const detailRecord = ref<any | null>(null)
const detailProduct = computed(() => detailRecord.value ? productMap.value[detailRecord.value.productId] : undefined)
function openDetail(row: any) {
  detailRecord.value = row
  showDetail.value = true
}

const columns = computed(() => [
  { title: '类型', key: 'type', render: (row: any) => h(NTag, { type: row.type === 'IN' ? 'success' : 'error', size: 'small' }, { default: () => (row.type === 'IN' ? '入库' : '出库') }) },
  { title: '货品', key: 'productId', render: (row: any) => {
    const p = productMap.value[row.productId]
    return p ? `${p.name}` : row.productId
  } },
  { title: '数量', key: 'qty' },
  { title: '创建时间', key: 'createdAt', render: (row: any) => fmt(row.createdAt) },
  { title: '备注', key: 'remark' },
  { title: '操作', key: 'actions', render: (row: any) => h(NButton, { size: 'small', onClick: () => openDetail(row) }, { default: () => '详情' }) },
])

function syncFilterFromRoute() {
  const q: any = route.query || {}
  ui.productId = (q.productId as string) || undefined
  // type and range from query if needed in future
}

async function applyFilter() {
  page.value = 1
  const f: any = {
    productId: ui.productId,
    type: ui.type,
  }
  await search(f)
}

function onClear() {
  ui.productId = undefined
  ui.type = undefined
  page.value = 1
  search({})
}

function onRefresh() {
  applyFilter()
}

onMounted(async () => {
  products.value = await listProducts()
  syncFilterFromRoute()
  await applyFilter()
})
</script>
