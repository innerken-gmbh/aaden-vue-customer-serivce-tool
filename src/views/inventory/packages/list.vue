<template>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">
        库存管理 · 包裹列表
      </h1>
      <n-space>
        <n-button
          :loading="loading"
          @click="load"
        >
          刷新
        </n-button>
      </n-space>
    </div>

    <div class="mt-3 flex flex-wrap items-end justify-between gap-3">
      <n-space
        align="end"
        item-style="display: flex; align-items: end; gap: 8px;"
      >
        <n-select
          v-model:value="relatedType"
          :options="relatedTypeOptions"
          placeholder="来源类型"
          clearable
          style="width: 160px"
        />
        <n-button
          :loading="loading"
          @click="applyFilter"
        >
          搜索
        </n-button>
        <n-button
          :disabled="loading"
          @click="onClear"
        >
          清空
        </n-button>
      </n-space>
      <n-space>
        <n-button
          type="primary"
          @click="onOpenCreate"
        >
          新建发出包裹
        </n-button>
      </n-space>
    </div>

    <n-modal
      v-model:show="showCreate"
      preset="card"
      title="新建发出包裹"
    >
      <n-form label-width="100">
        <n-form-item label="快递链接">
          <n-input
            v-model:value="form.trackingUrl"
            placeholder="https://..."
          />
        </n-form-item>
        <n-form-item label="预计到货">
          <n-date-picker
            v-model:value="form.eta"
            type="datetime"
            clearable
          />
        </n-form-item>
        <n-form-item label="包裹内容">
          <n-input
            v-model:value="form.contents"
            type="textarea"
            placeholder="例如：机器×1，配件×2"
          />
        </n-form-item>
        <n-form-item label="备注">
          <n-input
            v-model:value="form.remark"
            type="textarea"
          />
        </n-form-item>
        <n-form-item label="关联类型">
          <n-select
            v-model:value="form.relatedType"
            :options="relatedTypeOptions"
            clearable
          />
        </n-form-item>
        <n-form-item label="关联ID">
          <n-input
            v-model:value="form.relatedId"
            placeholder="可选：相关单据ID"
          />
        </n-form-item>
        <div class="flex justify-end gap-2">
          <n-button @click="showCreate=false">
            取消
          </n-button>
          <n-button
            type="primary"
            :loading="creating"
            @click="onCreate"
          >
            保存
          </n-button>
        </div>
      </n-form>
    </n-modal>

    <n-alert
      v-if="error"
      type="error"
      class="mt-3"
    >
      {{ error }}
    </n-alert>

    <n-spin
      :show="loading"
      class="mt-4 w-full"
    >
      <n-data-table
        :columns="columns"
        :data="pagedItems"
        :bordered="false"
        :row-key="rowKey"
      />
    </n-spin>

    <div class="mt-3 flex justify-end">
      <n-pagination
        v-model:page="page"
        :page-size="pageSize"
        :page-count="pageCount"
        :page-slot="7"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { NButton, NAlert, NSpin, NDataTable, NSpace, NSelect, NPagination, NModal, NForm, NFormItem, NInput, NDatePicker, NTag, useMessage, NPopconfirm } from 'naive-ui'
import { computed, h, onMounted, ref } from 'vue'
import { listPackages, createPackage, updatePackage } from '@/repo/inventory/packages.repo'
import useUserStore from '@/store/modules/user'

const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<any[]>([])

const relatedType = ref<'InboundNotice' | 'SalesOrder' | undefined>()

const showCreate = ref(false)
const creating = ref(false)
const msg = useMessage()

const form = ref({
  trackingUrl: '',
  eta: null as any,
  remark: '',
  contents: '',
  relatedType: 'SalesOrder' as 'InboundNotice' | 'SalesOrder',
  relatedId: '' as string,
})

const relatedTypeOptions = [
  { label: '入库预告', value: 'InboundNotice' },
  { label: '销售订单', value: 'SalesOrder' },
]

async function load() {
  loading.value = true
  error.value = null
  try {
    const filter: any = {}
    if (relatedType.value) filter.relatedType = relatedType.value
    items.value = await listPackages(filter)
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

function applyFilter() { page.value = 1; load() }
function onClear() { relatedType.value = undefined; page.value = 1; load() }

function onOpenCreate() {
  form.value = { trackingUrl: '', eta: null as any, remark: '', contents: '', relatedType: 'SalesOrder', relatedId: '' }
  showCreate.value = true
}

async function onCreate() {
  if (!form.value.trackingUrl) { msg.error('请填写快递链接'); return }
  creating.value = true
  try {
    await createPackage({
      trackingUrl: form.value.trackingUrl,
      relatedType: form.value.relatedType as any,
      relatedId: form.value.relatedId || undefined as any,
      status: 'IN_TRANSIT',
      eta: form.value.eta,
      contents: (form.value.contents || '').trim() ? form.value.contents : undefined,
      remark: form.value.remark,
    } as any)
    msg.success('已创建')
    showCreate.value = false
    await load()
  } catch (e: any) {
    msg.error(e?.message || String(e))
  } finally {
    creating.value = false
  }
}

onMounted(load)

const page = ref(1)
const pageSize = ref(50)
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

async function markDelivered(row: any) {
  try {
    const userStore = useUserStore()
    const registrar = userStore?.nickName || userStore?.userName || ''
    await updatePackage(row.id, { status: 'DELIVERED', arrivedAt: new Date(), arrivedBy: registrar } as any)
    msg.success('已标记到货')
    await load()
  } catch (e: any) {
    msg.error(e?.message || String(e))
  }
}

function statusTag(row: any) {
  const s = row.status || 'IN_TRANSIT'
  const type = s === 'DELIVERED' ? 'success' : s === 'CANCELLED' ? 'error' : s === 'CREATED' ? 'info' : 'warning'
  const label = s === 'DELIVERED' ? '已到货' : s === 'CANCELLED' ? '已取消' : s === 'CREATED' ? '已创建' : '运输中'
  return h(NTag as any, { type, strong: true }, { default: () => label })
}

const columns = computed(() => [
  { title: '追踪链接', key: 'trackingUrl', render: (row: any) => row.trackingUrl ? h('a', { href: row.trackingUrl, target: '_blank', class: 'text-blue-600' }, row.trackingUrl) : '-' },
  { title: '来源', key: 'relatedType', render: (row: any) => `${row.relatedType || '-'}#${row.relatedId || ''}` },
  { title: '状态', key: 'status', render: (row: any) => statusTag(row) },
  { title: '预计到货', key: 'eta', render: (row: any) => fmt(row.eta) },
  { title: '到货时间', key: 'arrivedAt', render: (row: any) => fmt(row.arrivedAt) },
  { title: '登记人', key: 'arrivedBy' },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
  { title: '创建于', key: 'createdAt', render: (row: any) => fmt(row.createdAt) },
  {
    title: '操作', key: 'actions', width: 140,
    render: (row: any) => {
      if (row.status === 'DELIVERED') return h('span', null, '-')
      return h(NPopconfirm as any, { onPositiveClick: () => markDelivered(row) }, {
        default: () => '确认标记到货？',
        trigger: () => h(NButton as any, { type: 'success', size: 'small' }, { default: () => '标记到货' })
      })
    }
  },
])
</script>
