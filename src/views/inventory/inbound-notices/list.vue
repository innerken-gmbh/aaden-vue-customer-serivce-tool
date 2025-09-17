<template>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">
        库存管理 · 入库预告
      </h1>
      <n-space>
        <n-button
          type="primary"
          :disabled="loading"
          @click="onCreate"
        >
          新建预告
        </n-button>
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
        align="center"
        item-style="display: flex; align-items: center; gap: 16px;"
      >
        <n-select
          v-model:value="status"
          :options="statusOptions"
          placeholder="状态"
          clearable
          style="width: 160px"
        />
        <n-input
          v-model:value="idKeyword"
          placeholder="根据ID搜索"
          clearable
          style="width: 240px"
          @keyup.enter="applyFilter"
        />
        <n-button
          :disabled="loading"
          @click="onClear"
        >
          清空
        </n-button>
      </n-space>
      <n-space>
        <!-- 批量位占位 -->
      </n-space>
    </div>

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

    <n-modal
      v-model:show="showEdit"
      preset="card"
      :title="form.id ? (locked ? '入库预告 · 详情' : '编辑入库预告') : '新建入库预告'"
      style="max-width: 840px"
    >
      <n-form
        ref="formRef"
        :model="form"
        label-placement="left"
        label-width="100"
      >
        <n-form-item
          label="供应商"
          path="vendor"
          :rule="{ required: true, message: '请选择或输入供应商' }"
        >
          <n-auto-complete
            v-model:value="form.vendor"
            :options="vendorOptions"
            placeholder="选择或输入供应商"
            :disabled="locked"
          />
        </n-form-item>
        <n-form-item
          label="提交人"
          path="submitter"
        >
          <n-auto-complete
            v-model:value="form.submitter"
            :options="submitterOptions"
            placeholder="选择或输入提交人"
            :disabled="locked"
          />
        </n-form-item>
        <n-form-item
          label="预计到货"
          path="eta"
          :rule="{ required: true, message: '请选择日期' }"
        >
          <n-date-picker
            v-model:value="form.eta"
            type="date"
            clearable
            :disabled="locked"
          />
        </n-form-item>
        <n-form-item
          label="追踪链接"
          path="trackingUrl"
        >
          <n-input
            v-model:value="form.trackingUrl"
            placeholder="http(s)://..."
            :disabled="locked"
          />
        </n-form-item>
        <n-form-item
          label="状态"
          path="status"
        >
          <n-select
            v-model:value="form.status"
            :options="statusOptions"
            :disabled="locked || !form.id"
          />
        </n-form-item>
        <n-form-item v-if="locked" label="实际到货" path="arrivedAt">
          <n-input :value="fmt(form.arrivedAt)" disabled />
        </n-form-item>
        <n-form-item v-if="locked" label="签收人" path="signedBy">
          <n-input v-model:value="form.signedBy" disabled />
        </n-form-item>

        <n-form-item label="到货清单">
          <div class="space-y-2 w-full">
            <div
              v-for="(line, idx) in form.items"
              :key="idx"
              class="flex items-center gap-2"
            >
              <n-select
                v-model:value="line.productId"
                :options="productOptions"
                placeholder="选择货品"
                style="width: 260px"
                :disabled="locked"
              />
              <n-input-number
                v-model:value="line.qty"
                :min="1"
                :disabled="locked"
              />
              <n-input
                v-model:value="line.remark"
                placeholder="备注"
                class="flex-1"
                :disabled="locked"
              />
              <n-button
                tertiary
                type="error"
                size="small"
                :disabled="locked"
                @click="removeLine(idx)"
              >
                移除
              </n-button>
            </div>
            <n-button
              tertiary
              size="small"
              :disabled="locked"
              @click="addLine"
            >
              添加一行
            </n-button>
            <div class="text-xs text-gray-500">
              至少添加 1 行，数量 > 0
            </div>
          </div>
        </n-form-item>

        <n-form-item
          label="备注"
          path="remark"
        >
          <n-input
            v-model:value="form.remark"
            type="textarea"
            :autosize="{ minRows: 2 }"
            :disabled="locked"
          />
        </n-form-item>
        <div class="flex justify-between items-center mt-2">
          <div
            v-if="locked"
            class="text-xs text-gray-500"
          >
            该预告已锁定，不能编辑或删除。
          </div>
          <div class="flex gap-2">
            <n-button @click="showEdit = false">
              取消
            </n-button>
            <n-button
              type="primary"
              :loading="loading"
              :disabled="locked"
              @click="onSubmit"
            >
              保存
            </n-button>
          </div>
        </div>
      </n-form>
    </n-modal>

    <!-- 到货确认弹窗 -->
    <n-modal
      v-model:show="showArrive"
      preset="card"
      title="确认到货"
      style="max-width: 520px"
    >
      <n-form label-placement="left" label-width="100">
        <n-form-item label="实际到货时间" path="arrivedAt">
          <n-date-picker v-model:value="arriveForm.arrivedAt" type="datetime" />
        </n-form-item>
        <n-form-item label="签收人" path="signedBy">
          <n-input v-model:value="arriveForm.signedBy" placeholder="请输入签收人" />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="arriveForm.remark" type="textarea" :autosize="{ minRows: 2 }" placeholder="可在到货时补充或修改备注" />
        </n-form-item>
        <div class="flex justify-end gap-2 mt-2">
          <n-button @click="showArrive = false">取消</n-button>
          <n-button type="primary" :loading="loading" @click="onConfirmArrive">确认到货并入库</n-button>
        </div>
      </n-form>
    </n-modal>

    <!-- 详情弹窗 -->
    <n-modal
      v-model:show="showDetail"
      preset="card"
      title="入库预告 · 详情"
      style="max-width: 720px"
    >
      <n-descriptions label-placement="left" column="2" label-align="left">
        <n-descriptions-item label="ID">{{ '#' + String(detail.id || '').slice(-4) }}</n-descriptions-item>
        <n-descriptions-item label="供应商">{{ detail.vendor }}</n-descriptions-item>
        <n-descriptions-item label="提交人">{{ detail.submitter || '-' }}</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="detail.status === 'ARRIVED' ? 'success' : 'warning'" size="small">
            {{ detail.status === 'ARRIVED' ? '已到货' : '待到货' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="预计到货">{{ fmtDate(detail.eta) }}</n-descriptions-item>
        <n-descriptions-item label="实际到货">{{ fmt(detail.arrivedAt) || '-' }}</n-descriptions-item>
        <n-descriptions-item label="签收人">{{ detail.signedBy || '-' }}</n-descriptions-item>
        <n-descriptions-item label="追踪链接">
          <a v-if="detail.trackingUrl" :href="detail.trackingUrl" target="_blank" class="text-blue-600">{{ detail.trackingUrl }}</a>
          <span v-else>-</span>
        </n-descriptions-item>
      </n-descriptions>

      <div class="mt-3">
        <div class="font-medium mb-1">到货清单</div>
        <div v-if="(detail.items || []).length" class="space-y-1">
          <div v-for="(it, idx) in detail.items" :key="idx" class="text-sm">
            {{ productMap[it.productId]?.name || it.productId }} × {{ it.qty }}
            <span v-if="it.remark" class="text-gray-500">（{{ it.remark }}）</span>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500">-</div>
      </div>

      <div class="mt-3">
        <div class="font-medium mb-1">备注</div>
        <div class="text-sm whitespace-pre-wrap">{{ detail.remark || '-' }}</div>
      </div>

      <div class="mt-3 text-xs text-gray-500">
        <span class="mr-4">创建于：{{ fmt(detail.createdAt) || '-' }}</span>
        <span>更新于：{{ fmt(detail.updatedAt) || '-' }}</span>
      </div>

      <div class="mt-4 text-right">
        <n-button @click="showDetail = false">关闭</n-button>
      </div>
    </n-modal>
  </div>
</template>
<script setup lang="ts">
import { NButton, NAlert, NSpin, NDataTable, NSpace, NSelect, NPagination, NModal, NForm, NFormItem, NInput, NDatePicker, NInputNumber, NDescriptions, NDescriptionsItem, NAutoComplete, NTag } from 'naive-ui'
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import { createInboundNotice, deleteInboundNotice, listInboundNotices, updateInboundNotice, confirmInboundArrival, getInboundNotice } from '@/repo/inventory/inbound-notices.repo'
import { listProducts } from '@/repo/inventory/products.repo'
import { listVendors, ensureVendor } from '@/repo/inventory/vendors.repo'
import { listSubmitters, ensureSubmitter } from '@/repo/inventory/submitters.repo'

const loading = ref(false)
const error = ref<string | null>(null)
const items = ref<any[]>([])

const status = ref<'ARRIVED' | 'PENDING' | undefined>('PENDING')
const statusOptions = [
  { label: '待到货', value: 'PENDING' },
  { label: '已到货', value: 'ARRIVED' },
]


// Products for item selection
const products = ref<any[]>([])
const productOptions = computed(() => products.value.map((p: any) => ({ label: `${p.code} · ${p.name}`, value: p.id })))
const productMap = computed<Record<string, any>>(() => Object.fromEntries(products.value.map((p: any) => [p.id, p])))

// Vendors for vendor selection
const vendors = ref<any[]>([])
const vendorOptions = computed(() => vendors.value.map((v: any) => ({ label: v.name, value: v.name })))

// Submitters for submitter selection
const submitters = ref<any[]>([])
const submitterOptions = computed(() => submitters.value.map((s: any) => ({ label: s.name, value: s.name })))

async function load() {
  loading.value = true
  error.value = null
  try {
    items.value = await listInboundNotices(status.value ? { status: status.value } : {})
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

function applyFilter() { page.value = 1; load() }
function onClear() { status.value = 'PENDING'; idKeyword.value = ''; page.value = 1; load() }

async function loadProducts() {
  try {
    products.value = await listProducts()
  } catch {}
}

async function loadVendors() {
  try {
    vendors.value = await listVendors()
  } catch {}
}

async function loadSubmitters() {
  try {
    submitters.value = await listSubmitters()
  } catch {}
}

onMounted(() => { load(); loadProducts(); loadVendors(); loadSubmitters() })
watch(status, () => { page.value = 1; load() })

const page = ref(1)
const pageSize = ref(50)
const idKeyword = ref<string>('')
const filteredItems = computed(() => {
  const list = items.value || []
  const kw = (idKeyword.value || '').trim().toLowerCase()
  if (!kw) return list
  return list.filter((x: any) => String((x.id || '')).slice(-4).toLowerCase().includes(kw))
})
const pageCount = computed(() => Math.max(1, Math.ceil((filteredItems.value?.length || 0) / pageSize.value)))
const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return (filteredItems.value || []).slice(start, start + pageSize.value)
})

const rowKey = (row: any) => row.id

// 到货确认弹窗状态
const showArrive = ref(false)
const arriveForm = reactive<{ id?: string; arrivedAt: any; signedBy: string; remark: string }>({ id: undefined, arrivedAt: Date.now(), signedBy: '', remark: '' })

// 详情弹窗状态
const showDetail = ref(false)
const detail = reactive<any>({ id: undefined, vendor: '', submitter: '', eta: null as any, trackingUrl: '', status: 'PENDING', remark: '', items: [] as any[], arrivedAt: null as any, signedBy: '', createdAt: null as any, updatedAt: null as any })
function onDetail(row: any) {
  Object.assign(detail, { id: row.id, vendor: row.vendor, submitter: row.submitter || '', eta: row.eta, trackingUrl: row.trackingUrl || '', status: row.status || 'PENDING', remark: row.remark || '', items: Array.isArray(row.items) ? row.items : [], arrivedAt: row.arrivedAt, signedBy: row.signedBy || '', createdAt: row.createdAt, updatedAt: row.updatedAt })
  showDetail.value = true
}

function fmt(dt: any) {
  if (!dt) return ''
  try {
    const ms = (dt as any).seconds ? (dt as any).seconds * 1000 : new Date(dt).getTime()
    const d = new Date(ms)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } catch {
    return ''
  }
}
function fmtDate(dt: any) {
  if (!dt) return ''
  try {
    const ms = (dt as any).seconds ? (dt as any).seconds * 1000 : new Date(dt).getTime()
    const d = new Date(ms)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return ''
  }
}

// Helpers: compare ETA date (date-only) with today for styling
function toMillis(dt: any): number {
  try {
    return (dt as any)?.seconds ? (dt as any).seconds * 1000 : new Date(dt).getTime()
  } catch {
    return NaN
  }
}
function startOfDayMs(ms: number): number {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
function isEtaOverdue(row: any): boolean {
  if (!row?.eta) return false
  const etaMs = toMillis(row.eta)
  if (!Number.isFinite(etaMs)) return false
  const etaDay = startOfDayMs(etaMs)
  const todayDay = startOfDayMs(Date.now())
  return etaDay < todayDay
}
function isEtaToday(row: any): boolean {
  if (!row?.eta) return false
  const etaMs = toMillis(row.eta)
  if (!Number.isFinite(etaMs)) return false
  const etaDay = startOfDayMs(etaMs)
  const todayDay = startOfDayMs(Date.now())
  return etaDay === todayDay
}

const columns = computed(() => [
  { title: 'ID', key: 'id', render: (row: any) => '#' + String(row.id || '').slice(-4) },
  { title: '供应商', key: 'vendor' },
  { title: '提交人', key: 'submitter', render: (row: any) => row.submitter || '-' },
  { title: '到货清单', key: 'items', render: (row: any) => {
    const lines = (row.items || []).map((l: any) => `${productMap.value[l.productId]?.name || l.productId}×${l.qty}`)
    return lines.length ? lines.join('，') : '-'
  } },
  { title: '预计到货', key: 'eta', render: (row: any) => {
    const text = fmtDate(row.eta) || '-'
    const pending = row.status !== 'ARRIVED'
    if (pending && isEtaOverdue(row)) {
      return h('span', { class: 'bg-red-500 text-white px-2 py-0.5 rounded' }, text)
    }
    if (pending && isEtaToday(row)) {
      return h('span', { class: 'bg-yellow-300 text-black px-2 py-0.5 rounded' }, text)
    }
    return text
  } },
  { title: '实际到货', key: 'arrivedAt', render: (row: any) => fmt(row.arrivedAt) },
  { title: '签收人', key: 'signedBy', render: (row: any) => row.signedBy || '-' },
  { title: '追踪链接', key: 'trackingUrl', render: (row: any) => row.trackingUrl ? h(NButton as any, { size: 'small', onClick: () => { const u = String(row.trackingUrl || '').trim(); if (!u) return; const href = /^https?:\/\//i.test(u) ? u : `https://${u}`; window.open(href, '_blank', 'noopener,noreferrer'); } }, { default: () => '查看' }) : '-' },
  { title: '状态', key: 'status', render: (row: any) => h(NTag as any, { type: row.status === 'ARRIVED' ? 'success' : 'warning', size: 'small' }, { default: () => (row.status === 'ARRIVED' ? '已到货' : '待到货') }) },
  { title: '备注', key: 'remark' },
  { title: '更新于', key: 'updatedAt', render: (row: any) => fmt(row.updatedAt) },
  { title: '操作', key: 'actions', render: (row: any) => {
    const btns = [
      h(NButton as any, { size: 'small', onClick: () => (row.status === 'ARRIVED' ? onDetail(row) : onEdit(row)) }, { default: () => (row.status === 'ARRIVED' ? '详情' : '编辑') }),
    ]
    if (row.status !== 'ARRIVED') {
      btns.unshift(h(NButton as any, { size: 'small', type: 'primary', onClick: () => onArrive(row) }, { default: () => '到货' }))
    }
    if (!row.locked) {
      btns.push(h(NButton as any, { size: 'small', tertiary: true, type: 'error', onClick: () => onDelete(row) }, { default: () => '删除' }))
    }
    return h(NSpace as any, { size: 8 }, { default: () => btns })
  } },
])

const showEdit = ref(false)
const formRef = ref()
const form = reactive<any>({ id: undefined, vendor: '', submitter: '', eta: null as any, trackingUrl: '', status: 'PENDING', remark: '', items: [] as any[], arrivedAt: null as any, signedBy: '' })
const locked = computed(() => !!(items.value.find((x) => x.id === form.id)?.locked))

function onCreate() {
  Object.assign(form, { id: undefined, vendor: '', submitter: '', eta: Date.now(), trackingUrl: '', status: 'PENDING', remark: '', items: [{ productId: '', qty: 1, remark: '' }], arrivedAt: null, signedBy: '' })
  showEdit.value = true
}

function onEdit(row: any) {
  Object.assign(form, { id: row.id, vendor: row.vendor, submitter: row.submitter || '', eta: row.eta, trackingUrl: row.trackingUrl || '', status: row.status || 'PENDING', remark: row.remark || '', items: Array.isArray(row.items) ? row.items : [], arrivedAt: row.arrivedAt, signedBy: row.signedBy || '' })
  showEdit.value = true
}

function addLine() {
  (form.items as any[]).push({ productId: '', qty: 1, remark: '' })
}
function removeLine(idx: number) {
  (form.items as any[]).splice(idx, 1)
}

async function onSubmit() {
  try {
    loading.value = true
    error.value = null

    // Concurrency guard: if editing an existing notice, re-fetch latest to ensure not already arrived/locked
    if (form.id) {
      const latest = await getInboundNotice(form.id)
      if (!latest) {
        throw new Error('入库预告不存在，可能已被删除，请刷新列表')
      }
      if (latest.locked || latest.status === 'ARRIVED') {
        throw new Error('该预告已到货或已被锁定，无法继续编辑，请刷新列表查看最新状态')
      }
    }

    // Ensure vendor exists in vendor list (Firebase); vendor persists as string on the notice
    const vendorName = (form.vendor || '').trim()
    if (vendorName) {
      try {
        await ensureVendor(vendorName)
        // Refresh vendors list (non-blocking)
        loadVendors()
      } catch {}
    }
    // Ensure submitter exists in submitter list
    const submitterName = (form.submitter || '').trim()
    if (submitterName) {
      try {
        await ensureSubmitter(submitterName)
        // Refresh submitters list (non-blocking)
        loadSubmitters()
      } catch {}
    }
    const itemsPayload = (form.items || []).map((x: any) => ({ productId: x.productId, qty: Number(x.qty) || 0, remark: x.remark || undefined }))
    const payload = { vendor: vendorName, submitter: submitterName || undefined, eta: form.eta, trackingUrl: form.trackingUrl || undefined, status: form.status, remark: form.remark, items: itemsPayload }
    if (!form.id) await createInboundNotice(payload as any)
    else await updateInboundNotice(form.id, payload as any)
    await load()
    showEdit.value = false
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

function onArrive(row: any) {
  arriveForm.id = row.id
  arriveForm.arrivedAt = Date.now()
  arriveForm.signedBy = ''
  arriveForm.remark = row.remark || ''
  showArrive.value = true
}

async function onConfirmArrive() {
  if (!arriveForm.id) return
  if (!arriveForm.signedBy || !arriveForm.signedBy.trim()) {
    error.value = '请填写签收人'
    return
  }
  try {
    loading.value = true
    error.value = null
    await confirmInboundArrival(arriveForm.id, undefined as any, { signedBy: arriveForm.signedBy, arrivedAt: arriveForm.arrivedAt, remark: arriveForm.remark })
    await load()
    showArrive.value = false
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}

async function onDelete(row: any) {
  try {
    loading.value = true
    await deleteInboundNotice(row.id)
    await load()
  } catch (e: any) {
    error.value = e?.message || String(e)
  } finally {
    loading.value = false
  }
}
</script>
