<template>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">
        库存管理 · 销售订单
      </h1>
      <n-space>
        <n-button
          type="primary"
          :disabled="loading"
          @click="onCreate"
        >
          新建订单
        </n-button>
        <n-button
          :loading="loading"
          @click="load"
        >
          刷新
        </n-button>
      </n-space>
    </div>

    <!-- 错误提示 -->
    <n-alert
      v-if="error"
      type="error"
      class="mt-3"
    >
      {{ error }}
    </n-alert>

    <!-- 搜索工具条 -->
    <div class="mt-4 flex flex-wrap items-end gap-3">
      <n-input
        v-model:value="filters.orderNo"
        clearable
        placeholder="单据编号（模糊）"
        style="width: 220px"
      />
      <n-input
        v-model:value="filters.customerCode"
        clearable
        placeholder="客户名称（模糊）"
        style="width: 220px"
      />
      <n-input
        v-model:value="filters.id4"
        clearable
        placeholder="ID后四位"
        style="width: 160px"
      />
      <n-select
        v-model:value="filters.shipStatus"
        :options="shipStatusOptions"
        clearable
        placeholder="发货状态"
        style="width: 160px"
      />
      <n-date-picker
        v-model:value="filters.timeRange"
        type="datetimerange"
        clearable
        placeholder="时间范围（按更新时间）"
        style="width: 320px"
      />
      <n-space>
        <n-button @click="onSearch">
          查询
        </n-button>
        <n-button
          quaternary
          @click="onReset"
        >
          清空
        </n-button>
      </n-space>
    </div>

    <!-- 列表 -->
    <n-spin
      :show="loading"
      class="mt-4 w-full"
    >
      <n-data-table
        :columns="columns"
        :data="pagedItems"
        :bordered="false"
        :row-key="rowKey"
        :checked-row-keys="checkedKeys"
        checkable
        @update:checked-row-keys="onCheckedKeysChange"
      />
    </n-spin>

    <!-- 批量操作与分页 -->
    <div class="mt-4 flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-2">
        <n-button
          :disabled="!canBatchDelete || loading"
          type="error"
          tertiary
          @click="onBatchDelete"
        >
          批量删除（未发货）
        </n-button>
        <span class="text-gray-500 text-sm">已选 {{ checkedKeys.length }} 项</span>
      </div>
      <n-pagination
        :page="page"
        :page-size="pageSize"
        :item-count="filteredItems.length"
        show-size-picker
        :page-sizes="[10, 20, 50]"
        @update:page="(p:number)=> page = p"
        @update:page-size="onPageSizeChange"
      />
    </div>

    <!-- 发货对话框 -->
    <n-modal
      v-model:show="showShip"
      preset="card"
      title="订单发货"
      style="max-width: 520px"
    >
      <n-form
        ref="shipFormRef"
        :model="shipForm"
        :rules="shipRules"
        label-placement="left"
        label-width="100"
      >
        <n-form-item
          label="追踪链接"
          path="trackingLinks"
        >
          <n-input
            v-model:value="shipForm.trackingLinks"
            type="textarea"
            :autosize="{ minRows: 3 }"
            placeholder="必填；多条用逗号分隔；需以 http/https 开头"
          />
        </n-form-item>
        <n-form-item
          label="主设备编号"
          path="mainDeviceCode"
        >
          <n-input
            v-model:value="shipForm.mainDeviceCode"
            placeholder="必填"
          />
        </n-form-item>
        <n-form-item
          label="发货时间"
          path="shipAt"
        >
          <n-date-picker
            v-model:value="shipForm.shipAt"
            type="datetime"
          />
        </n-form-item>
        <n-form-item
          label="备注"
          path="remark"
        >
          <n-input
            v-model:value="shipForm.remark"
            placeholder="可选"
          />
        </n-form-item>

        <n-divider title-placement="left">
          核对清单
        </n-divider>
        <div class="max-h-60 overflow-y-auto px-1">
          <n-checkbox-group v-model:value="shipChecked">
            <div
              v-for="(it, idx) in shipItems"
              :key="idx"
              class="flex items-center gap-2 mb-2"
            >
              <n-checkbox :value="String(idx)">
                <span>{{ productLabel(it.productId) }}</span>
                <span class="text-gray-400 ml-1">x {{ it.qty }}</span>
              </n-checkbox>
            </div>
          </n-checkbox-group>
        </div>

        <n-divider title-placement="left">
          上传发货照片/文件（可选）
        </n-divider>
        <n-upload
          :custom-request="shipUploadRequest"
          :multiple="true"
          :show-file-list="false"
        >
          <n-button size="small">
            上传文件
          </n-button>
        </n-upload>

        <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div>只有勾选完全部货品后，才能确认发货。</div>
          <div>已上传 {{ shipUploadUrls.length }} 个文件</div>
        </div>

        <div class="flex justify-end gap-2 mt-2">
          <n-button @click="showShip = false">
            取消
          </n-button>
          <n-button
            type="primary"
            :loading="loading"
            :disabled="!allChecked"
            @click="onSubmitShip"
          >
            确认发货
          </n-button>
        </div>
      </n-form>
    </n-modal>

    <!-- 新建/编辑订单 -->
    <n-modal
      v-model:show="showEdit"
      preset="card"
      :title="form.id ? '编辑订单' : '新建订单'"
      style="max-width: 860px"
    >
      <n-form
        ref="editFormRef"
        :model="form"
        :rules="editRules"
        label-placement="left"
        label-width="96"
      >
        <div class="grid grid-cols-2 gap-4">
          <n-form-item
            label="单据编号"
            path="billNo"
          >
            <n-input
              v-model:value="form.billNo"
              placeholder="必填"
            />
          </n-form-item>
          <n-form-item
            label="客户名称"
            path="customerCode"
          >
            <n-input
              v-model:value="form.customerCode"
              placeholder="必填"
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
            />
          </n-form-item>
          <n-form-item
            label="备注"
            path="remark"
          >
            <n-input
              v-model:value="form.remark"
              placeholder="可选"
            />
          </n-form-item>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-2">
          <n-form-item
            label="预计发货日期"
            path="expectedShipAt"
          >
            <n-date-picker
              v-model:value="form.expectedShipAt"
              type="date"
              clearable
              placeholder="可选"
              :is-date-disabled="disableBeforeTomorrow"
            />
          </n-form-item>
        </div>

        <div class="mt-2 flex items-center gap-2">
          <n-select
            v-model:value="selectedBomId"
            :options="bomOptions"
            filterable
            clearable
            placeholder="选择BOM导入"
            style="width: 260px"
          />
          <n-button
            :disabled="!selectedBomId"
            @click="onImportBom"
          >
            导入BOM
          </n-button>
          <n-button
            tertiary
            @click="addItem"
          >
            添加一行
          </n-button>
        </div>

        <div class="mt-3 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-gray-500">
                <th class="text-left p-2">
                  货品
                </th>
                <th
                  class="text-left p-2"
                  style="width: 140px;"
                >
                  数量
                </th>
                <th
                  class="text-left p-2"
                  style="width: 180px;"
                >
                  库存
                </th>
                <th class="text-left p-2">
                  备注
                </th>
                <th
                  class="p-2"
                  style="width: 80px;"
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(it, idx) in form.items"
                :key="idx"
              >
                <td class="p-2">
                  <n-select
                    v-model:value="it.productId"
                    :options="productOptions"
                    filterable
                    placeholder="选择货品"
                    style="min-width: 260px"
                  />
                </td>
                <td class="p-2">
                  <n-input-number
                    v-model:value="(it as any).qty"
                    :min="1"
                    style="width: 120px"
                  />
                </td>
                <td class="p-2">
                  <div v-if="it.productId">
                    <span :class="stockTextClass(it.productId)">库存：{{ Number(getProduct(it.productId)?.stock || 0) }}</span>
                    <span class="mx-1 text-gray-400">/</span>
                    <span :class="reservedTextClass(it.productId)">已预订：{{ Number((getProduct(it.productId) as any)?.reservedStock || 0) }}</span>
                  </div>
                  <div
                    v-else
                    class="text-gray-400"
                  >
                    -
                  </div>
                </td>
                <td class="p-2">
                  <n-input
                    v-model:value="it.remark"
                    placeholder="可选"
                  />
                </td>
                <td class="p-2 text-right">
                  <n-button
                    size="small"
                    tertiary
                    type="error"
                    @click="removeItem(idx)"
                  >
                    删除
                  </n-button>
                </td>
              </tr>
              <tr v-if="!form.items.length">
                <td
                  class="p-2 text-gray-400"
                  colspan="5"
                >
                  暂无明细，请添加或从BOM导入
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <n-divider />
        <n-form-item
          label="配置要求"
          path="configRequirements"
        >
          <n-input
            v-model:value="form.configRequirements"
            type="textarea"
            :autosize="{ minRows: 3 }"
            placeholder="可选：例如装配/贴标/测试等特殊要求"
          />
        </n-form-item>

        <n-divider title-placement="left">
          上传附件（可选）
        </n-divider>
        <n-upload
          :custom-request="editUploadRequest"
          :multiple="true"
          :show-file-list="false"
          :disabled="isShippedById(form.id)"
        >
          <n-button size="small">
            上传文件
          </n-button>
        </n-upload>
        <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div>已上传 {{ editAttachments.length }} 个文件</div>
        </div>
        <div
          v-if="editAttachments.length"
          class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2"
        >
          <div
            v-for="(url, i) in editAttachments"
            :key="i"
            class="border rounded p-2 flex flex-col items-start gap-2"
          >
            <template v-if="isImageUrl(url)">
              <n-image
                :src="url"
                width="120"
              />
              <a
                :href="url"
                class="text-xs text-blue-500 hover:underline break-all"
                target="_blank"
              >{{ fileNameFromUrl(url) }}</a>
            </template>
            <template v-else>
              <span class="text-xs break-all">{{ fileNameFromUrl(url) }}</span>
              <a
                :href="url"
                class="text-blue-500 hover:underline text-xs"
                target="_blank"
              >下载</a>
            </template>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-3">
          <n-button @click="showEdit = false">
            取消
          </n-button>
          <n-button
            type="primary"
            :loading="loading"
            @click="onSubmitEdit"
          >
            保存
          </n-button>
        </div>
      </n-form>
    </n-modal>

    <!-- 订单详情 -->
    <n-modal
      v-model:show="showDetail"
      preset="card"
      title="订单详情"
      style="max-width: 860px"
    >
      <div v-if="detailOrder">
        <div class="mb-2 text-sm text-gray-600 space-y-1">
          <div>单据编号：{{ detailOrder.billNo }}</div>
          <div>客户名称：{{ detailOrder.customerCode }}</div>
          <div>主设备编号：{{ (detailOrder as any).mainDeviceCode || '-' }}</div>
          <div>发货状态：{{ detailOrder.shipStatus === 'SHIPPED' ? '已发货' : '未发货' }}</div>
          <div v-if="(detailOrder as any).configRequirements">
            配置要求：{{ (detailOrder as any).configRequirements }}
          </div>
        </div>
        <n-divider title-placement="left">
          快递链接
        </n-divider>
        <div
          v-if="detailTrackingLinks.length"
          class="space-y-1"
        >
          <div class="flex flex-col gap-1">
            <div
              v-for="(link, i) in detailTrackingLinks"
              :key="i"
              class="flex items-center gap-2"
            >
              <span class="text-xs break-all">{{ link }}</span>
              <n-button
                size="tiny"
                tertiary
                type="primary"
                @click="openLink(link)"
              >
                打开
              </n-button>
            </div>
          </div>
        </div>
        <div
          v-else
          class="text-gray-400"
        >
          暂无快递链接
        </div>
        <n-divider title-placement="left">
          货品清单
        </n-divider>
        <div v-if="detailOrder.items && detailOrder.items.length">
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="text-gray-500">
                  <th class="text-left p-2">
                    货品
                  </th>
                  <th
                    class="text-left p-2"
                    style="width: 120px;"
                  >
                    数量
                  </th>
                  <th class="text-left p-2">
                    备注
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(it, i) in detailOrder.items"
                  :key="i"
                >
                  <td class="p-2">
                    {{ productLabel(it.productId) }}
                  </td>
                  <td class="p-2">
                    {{ it.qty }}
                  </td>
                  <td class="p-2">
                    {{ it.remark || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div
          v-else
          class="text-gray-400"
        >
          暂无货品明细
        </div>
        <n-divider title-placement="left">
          附件
        </n-divider>
        <div
          v-if="(detailOrder.attachments && detailOrder.attachments.length)"
          class="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div
            v-for="(url, i) in detailOrder.attachments"
            :key="i"
            class="border rounded p-2 flex flex-col items-start gap-2"
          >
            <template v-if="isImageUrl(url)">
              <n-image
                :src="url"
                width="120"
              />
              <a
                :href="url"
                class="text-xs text-blue-500 hover:underline break-all"
                target="_blank"
              >{{ fileNameFromUrl(url) }}</a>
            </template>
            <template v-else>
              <span class="text-xs break-all">{{ fileNameFromUrl(url) }}</span>
              <a
                :href="url"
                class="text-blue-500 hover:underline text-xs"
                target="_blank"
              >下载</a>
            </template>
          </div>
        </div>
        <div
          v-else
          class="text-gray-400"
        >
          暂无附件
        </div>
      </div>
    </n-modal>
  </div>
</template>
<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import { NAlert, NButton, NDataTable, NDatePicker, NForm, NFormItem, NInput, NInputNumber, NModal, NPagination, NPopconfirm, NSelect, NSpace, NSpin, useMessage, NTag, NAutoComplete, NUpload, NDivider, NImage } from 'naive-ui'
import useSalesOrdersVM from '@/vm/inventory/useSalesOrdersVM'
import type { SalesOrder } from '@/repo/inventory/types'
import { listProducts } from '@/repo/inventory/products.repo'
import type { Product } from '@/repo/inventory/types'
import { listBoms } from '@/repo/inventory/boms.repo'
import { listSubmitters, ensureSubmitter } from '@/repo/inventory/submitters.repo'
import { updateSalesOrder, getSalesOrder } from '@/repo/inventory/sales-orders.repo'
import { uploadFile, checkFileType, imageList } from '@/store/aaden/utils.js'

const message = useMessage()

const { loading, items, error, load, remove, doShip, editing, save, mergeFromBom } = useSalesOrdersVM()

onMounted(() => {
  load()
})

// 搜索筛选
const filters = reactive<{ orderNo: string; customerCode: string; id4: string; shipStatus: 'PENDING' | 'SHIPPED' | null; timeRange: [number, number] | null }>({
  orderNo: '',
  customerCode: '',
  id4: '',
  shipStatus: null,
  timeRange: null,
})

const shipStatusOptions = [
  { label: '未发货', value: 'PENDING' },
  { label: '已发货', value: 'SHIPPED' },
]

let searchTimer: any = null
watch(() => ({ ...filters }), () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
  }, 300)
}, { deep: true })

function onSearch() {
  page.value = 1
}

function onReset() {
  filters.orderNo = ''
  filters.customerCode = ''
  filters.id4 = ''
  filters.shipStatus = null
  filters.timeRange = null as any
  page.value = 1
}

// 选择/批量
const checkedKeys = ref<string[]>([])
function onCheckedKeysChange(keys: string[]) {
  checkedKeys.value = keys
}
const rowKey = (row: SalesOrder) => row.id as string

// 过滤 + 排序 + 分页（前端）
const filteredItems = computed(() => {
  let arr = (items.value || []) as SalesOrder[]
  if (filters.orderNo?.trim()) {
    const k = filters.orderNo.trim().toLowerCase()
    arr = arr.filter(x => (x.billNo || '').toLowerCase().includes(k))
  }
  if (filters.customerCode?.trim()) {
    const k = filters.customerCode.trim().toLowerCase()
    arr = arr.filter(x => (x.customerCode || '').toLowerCase().includes(k))
  }
  if (filters.id4?.trim()) {
    const k = filters.id4.trim().toLowerCase()
    arr = arr.filter(x => String((x.id || '')).slice(-4).toLowerCase().includes(k))
  }
  if (filters.shipStatus) {
    arr = arr.filter(x => x.shipStatus === filters.shipStatus)
  }
  if (filters.timeRange && filters.timeRange[0] && filters.timeRange[1]) {
    const [start, end] = filters.timeRange
    arr = arr.filter(x => {
      const t = toMillis(x.updatedAt)
      return t >= start && t <= end
    })
  }
  // 默认按 预计发货时间(expectedShipAt) 倒序，其次按更新时间倒序
  arr = arr.slice().sort((a: any, b: any) => {
    const ea = toMillis(a.expectedShipAt)
    const eb = toMillis(b.expectedShipAt)
    if (ea !== eb) return eb - ea
    return toMillis(b.updatedAt) - toMillis(a.updatedAt)
  })
  return arr
})

function toMillis(v: any): number {
  if (!v) return 0
  if (typeof v === 'number') return v
  if (v?.toMillis) return v.toMillis()
  const t = new Date(v).getTime()
  return isNaN(t) ? 0 : t
}

// Disable picking dates earlier than tomorrow (local time)
function startOfTomorrowMs(): number {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return startOfToday.getTime() + 24 * 60 * 60 * 1000
}
function disableBeforeTomorrow(ts: number): boolean {
  return ts < startOfTomorrowMs()
}

const page = ref(1)
const pageSize = ref(50)
const pagedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredItems.value.slice(start, start + pageSize.value)
})
function onPageSizeChange(ps: number) {
  pageSize.value = ps
  page.value = 1
}

// 编辑弹窗状态与表单
const showEdit = ref(false)
const editFormRef = ref()
const form = reactive<any>({ id: undefined, billNo: '', customerCode: '', submitter: '', items: [] as any[], remark: '', configRequirements: '', expectedShipAt: null as any })
const editRules = {
  billNo: { required: true, message: '请填写单据编号', trigger: ['input', 'blur'] },
  customerCode: { required: true, message: '请填写客户名称', trigger: ['input', 'blur'] },
  expectedShipAt: {
    async validator(_: any, v: number | null) {
      if (!v) return true
      if (typeof v !== 'number') return true
      if (v < startOfTomorrowMs()) throw new Error('预计发货日期最早为明天')
      return true
    },
    trigger: ['change', 'blur']
  }
}





const productOptions = ref<{ label: string; value: string }[]>([])
const productList = ref<Product[]>([])
const productMap = computed(() => {
  const m = new Map<string, Product>()
  for (const p of productList.value || []) m.set(p.id as string, p)
  return m
})
function getProduct(pid: string | undefined): Product | undefined {
  if (!pid) return undefined
  return productMap.value.get(pid)
}
function stockTextClass(pid?: string) {
  const p = pid ? getProduct(pid) : undefined
  const stock = Number(p?.stock || 0)
  return stock <= 0 ? 'text-red-500 font-medium' : ''
}
function reservedTextClass(pid?: string) {
  const p = pid ? getProduct(pid) : undefined
  const stock = Number(p?.stock || 0)
  const reserved = Number((p as any)?.reservedStock || 0)
  return reserved > stock ? 'text-yellow-600 font-medium' : ''
}
const bomOptions = ref<{ label: string; value: string }[]>([])
const selectedBomId = ref<string | null>(null)
const bomList = ref<any[]>([])

// Submitters options
const submitters = ref<any[]>([])
const submitterOptions = computed(() => submitters.value.map((s: any) => ({ label: s.name, value: s.name })))

async function ensureOptionsLoaded() {
  if (!productOptions.value.length || !productList.value.length) {
    const prods = await listProducts()
    productList.value = prods
    productOptions.value = prods.map(p => ({ label: `${p.code} · ${p.name}`, value: p.id as string }))
  }
  if (!bomOptions.value.length) {
    const boms = await listBoms()
    bomList.value = boms
    bomOptions.value = boms.map(b => ({ label: b.name, value: b.id as string }))
  }
  if (!submitters.value.length) {
    try {
      submitters.value = await listSubmitters()
    } catch {}
  }
}

function addItem() {
  form.items.push({ productId: '', qty: 1, remark: '' })
}
function removeItem(idx: number) {
  form.items.splice(idx, 1)
}

async function onImportBom() {
  if (!selectedBomId.value) return
  await ensureOptionsLoaded()
  const b = bomList.value.find((x: any) => x.id === selectedBomId.value)
  if (!b) return
  // 让 VM 合并到当前表单
  ;(editing as any).value = form
  mergeFromBom(b)
  // 保持 items 引用
  form.items = (editing as any).value.items
  message.success('已从BOM导入/合并明细')
}

// 行操作
async function onCreate() {
  Object.assign(form, { id: undefined, billNo: '', customerCode: '', submitter: '', items: [], remark: '', configRequirements: '', expectedShipAt: null })
  selectedBomId.value = null
  editAttachments.value = []
  ;(editing as any).value = form
  showEdit.value = true
  await ensureOptionsLoaded()
}

async function onDelete(row: SalesOrder) {
  if (row.locked || row.shipStatus === 'SHIPPED') {
    message.warning('已发货订单不可删除')
    return
  }
  await remove(row.id!)
  message.success('已删除')
}

// 批量删除（仅未发货）
const canBatchDelete = computed(() => checkedKeys.value.length > 0 && checkedKeys.value.every(id => {
  const r = items.value.find(x => x.id === id)
  return r && r.shipStatus === 'PENDING'
}))

async function onBatchDelete() {
  if (!canBatchDelete.value) return
  if (!(await confirmAsync(`确认删除选中的 ${checkedKeys.value.length} 条未发货订单？`))) return
  for (const id of checkedKeys.value) {
    await remove(id)
  }
  checkedKeys.value = []
  message.success('批量删除完成')
}

function confirmAsync(msg: string): Promise<boolean> {
  return new Promise((resolve) => {
    const d = window.confirm(msg)
    resolve(d)
  })
}

// 发货
const showShip = ref(false)
const shipFormRef = ref()
const shipForm = reactive<{ orderId: string | null; trackingLinks: string; mainDeviceCode: string; shipAt: number | null; remark: string }>({ orderId: null, trackingLinks: '', mainDeviceCode: '', shipAt: Date.now(), remark: '' })
const shipRules = {
  trackingLinks: {
    required: true,
    message: '请填写追踪链接（多条用逗号）',
    validator(_: any, v: string) {
      const parts = (v || '').split(',').map(s => s.trim()).filter(Boolean)
      if (parts.length === 0) return new Error('至少填写一条追踪链接')
      if (parts.some(p => !/^https?:\/\//i.test(p))) return new Error('每条必须以 http/https 开头')
      return true
    },
    trigger: ['blur', 'input']
  },
  mainDeviceCode: {
    required: true,
    message: '请填写主设备编号',
    trigger: ['input', 'blur']
  }
}

// 附件与发货核对相关状态与方法
const showDetail = ref(false)
const detailOrder = ref<SalesOrder | null>(null)
const detailTrackingLinks = computed(() => {
  const s = (detailOrder.value?.shipTrackingUrls || '') as string
  return (s || '').split(',').map(s => s.trim()).filter(Boolean)
})
function normalizeUrl(link: string) {
  if (!link) return ''
  return /^https?:\/\//i.test(link) ? link : `https://${link}`
}
function openLink(link: string) {
  const url = normalizeUrl(link)
  window.open(url, '_blank')
}
const shipChecked = ref<string[]>([])
const shipUploadUrls = ref<string[]>([])
const shipCurrentOrder = computed(() => (shipForm.orderId ? (items.value.find(x => x.id === shipForm.orderId) || null) : null))
const shipItems = computed(() => shipCurrentOrder.value?.items || [])
const allChecked = computed(() => shipItems.value.length > 0 && shipChecked.value.length === shipItems.value.length)
const productLabelMap = computed(() => {
  const m = new Map<string, string>()
  for (const o of productOptions.value) m.set(o.value, o.label)
  return m
})
function productLabel(id: string) { return productLabelMap.value.get(id) || id }

function isImageUrl(url: string): boolean {
  try {
    const ext = (checkFileType(url) || '').toLowerCase()
    return (imageList as string[]).includes(ext)
  } catch {
    return false
  }
}
function fileNameFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const p = u.pathname
    return p.substring(p.lastIndexOf('/') + 1) || url
  } catch {
    const i = url.lastIndexOf('/')
    return i >= 0 ? url.slice(i + 1) : url
  }
}

const editAttachments = ref<string[]>([])
function isShippedById(id?: string) {
  if (!id) return false
  const row = items.value.find(x => x.id === id)
  return row?.shipStatus === 'SHIPPED'
}
async function editUploadRequest(opts: any) {
  const { file, onFinish, onError } = opts || {}
  try {
    const f: File = file?.file || file
    const res: any = await uploadFile(f)
    const url: string = typeof res === 'string' ? res : (res?.url || res?.data?.url || res?.data || '')
    if (!url) throw new Error('上传失败')
    if (!editAttachments.value.includes(url)) editAttachments.value.push(url)
    onFinish && onFinish()
    message.success('上传成功')
  } catch (e: any) {
    onError && onError()
    message.error(e?.message || '上传失败')
  }
}

async function onShowDetail(row: SalesOrder) {
  detailOrder.value = row
  await ensureOptionsLoaded()
  showDetail.value = true
}

// NUpload 自定义上传 - 发货对话框
async function shipUploadRequest(opts: any) {
  const { file, onFinish, onError } = opts || {}
  try {
    const f: File = file?.file || file
    const res: any = await uploadFile(f)
    const url: string = typeof res === 'string' ? res : (res?.url || res?.data?.url || res?.data || '')
    if (!url) throw new Error('上传失败')
    shipUploadUrls.value.push(url)
    onFinish && onFinish()
    message.success('上传成功')
  } catch (e: any) {
    onError && onError()
    message.error(e?.message || '上传失败')
  }
}

// NUpload 自定义上传 - 列表行
function makeUploadCustomRequest(orderId: string) {
  return async (opts: any) => {
    const { file, onFinish, onError } = opts || {}
    try {
      const f: File = file?.file || file
      const res: any = await uploadFile(f)
      const url: string = typeof res === 'string' ? res : (res?.url || res?.data?.url || res?.data || '')
      if (!url) throw new Error('上传失败')
      // 取当前附件并追加
      const row = items.value.find(x => x.id === orderId)
      const existed = (row?.attachments || []) as string[]
      const next = Array.from(new Set([ ...existed, url ]))
      await updateSalesOrder(orderId, { attachments: next as any })
      if (row) (row as any).attachments = next
      message.success('上传成功')
      onFinish && onFinish()
    } catch (e: any) {
      message.error(e?.message || '上传失败')
      onError && onError()
    }
  }
}

async function onShip(row: SalesOrder) {
  if (row.shipStatus === 'SHIPPED') {
    message.info('该订单已发货')
    return
  }
  shipForm.orderId = row.id || null
  shipForm.trackingLinks = ''
  shipForm.mainDeviceCode = (row as any).mainDeviceCode || ''
  shipForm.shipAt = Date.now()
  shipForm.remark = ''
  shipChecked.value = []
  shipUploadUrls.value = []
  await ensureOptionsLoaded()
  showShip.value = true
}

async function onSubmitShip() {
  await (shipFormRef.value as any)?.validate?.()
  if (!shipForm.orderId) return
  if (!allChecked.value) {
    message.warning('请先完成核对清单勾选')
    return
  }
  const tracking = shipForm.trackingLinks
  try {
    const updates: any = { mainDeviceCode: shipForm.mainDeviceCode }
    if (shipUploadUrls.value.length > 0) {
      const current = items.value.find(x => x.id === shipForm.orderId) || await getSalesOrder(shipForm.orderId)
      const existed = ((current as any)?.attachments || []) as string[]
      const merged = Array.from(new Set([ ...existed, ...shipUploadUrls.value ]))
      updates.attachments = merged as any
    }
    await updateSalesOrder(shipForm.orderId, updates)
    const idx = items.value.findIndex(x => x.id === shipForm.orderId)
    if (idx >= 0) {
      if (updates.attachments) (items.value[idx] as any).attachments = updates.attachments
      ;(items.value[idx] as any).mainDeviceCode = updates.mainDeviceCode
    }
    await doShip(shipForm.orderId, tracking)
    message.success('发货成功')
    showShip.value = false
  } catch (e: any) {
    message.error(e?.message || String(e))
  }
}

const columns = computed(() => [
  { title: 'ID', key: 'id4', render: (row: SalesOrder) => '#' + String((row.id as string) || '').slice(-4) },
  { title: '单据编号', key: 'billNo' },
  { title: '客户名称', key: 'customerCode' },
  { title: '提交人', key: 'submitter', render: (row: SalesOrder) => (row as any).submitter || '-' },
  { title: '备注', key: 'remark', render: (row: SalesOrder) => (row.remark || '-') },
  { title: '明细数', key: 'items', render: (row: SalesOrder) => (row.items?.length || 0) + '' },
  { title: '发货状态', key: 'shipStatus', render: (row: SalesOrder) => h(NTag, { type: row.shipStatus === 'SHIPPED' ? 'success' : 'warning', size: 'small' }, { default: () => (row.shipStatus === 'SHIPPED' ? '已发货' : '未发货') }) },
  { title: '预计发货日期', key: 'expectedShipAt', render: (row: SalesOrder) => formatDate((row as any).expectedShipAt) },
  { title: '发货时间', key: 'shippedAt', render: (row: SalesOrder) => formatTime(row.shippedAt) },
  {
    title: '附件',
    key: 'attachments',
    render(row: SalesOrder) {
      const count = (row.attachments?.length || 0)
      return h(NSpace, { size: 8 }, {
        default: () => [
          h('span', { class: 'text-gray-500 text-xs' }, count ? `共 ${count} 个` : '-'),
          h(NUpload as any, { multiple: true, showFileList: false, customRequest: makeUploadCustomRequest(row.id as string), disabled: row.shipStatus === 'SHIPPED' } as any, {
            default: () => h(NButton, { size: 'small' }, { default: () => '上传' })
          })
        ]
      })
    }
  },
  { title: '更新时间', key: 'updatedAt', render: (row: SalesOrder) => formatTime(row.updatedAt) },
  {
    title: '操作',
    key: 'actions',
    render(row: SalesOrder) {
      const disabled = row.shipStatus === 'SHIPPED'
      return h(NSpace, { size: 8 }, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => onShowDetail(row) }, { default: () => '详情' }),
          h(NButton, { size: 'small', disabled, onClick: () => onEdit(row) }, { default: () => '编辑' }),
          h(NPopconfirm, { onPositiveClick: () => onDelete(row) }, {
            default: () => '确认删除该订单？',
            trigger: () => h(NButton, { size: 'small', tertiary: true, type: 'error', disabled }, { default: () => '删除' }),
          }),
          h(NButton, { size: 'small', type: 'primary', tertiary: true, disabled, onClick: () => onShip(row) }, { default: () => '发货' }),
        ]
      })
    }
  }
])

async function onEdit(row: SalesOrder) {
  if (row.shipStatus === 'SHIPPED' || row.locked) {
    message.warning('已发货订单不可编辑')
    return
  }
  Object.assign(form, {
    id: row.id,
    billNo: row.billNo || '',
    customerCode: row.customerCode || '',
    submitter: (row as any).submitter || '',
    remark: row.remark || '',
    configRequirements: (row as any).configRequirements || '',
    expectedShipAt: toMillis((row as any).expectedShipAt) || null,
    items: (row.items || []).map(it => ({ productId: it.productId, qty: it.qty, remark: it.remark || '' }))
  })
  editAttachments.value = ((row as any).attachments || []) as string[]
  selectedBomId.value = null
  ;(editing as any).value = form
  showEdit.value = true
  await ensureOptionsLoaded()
}

async function onSubmitEdit() {
  await (editFormRef.value as any)?.validate?.()
  // 清理无效明细
  form.items = (form.items || []).filter((it: any) => it && it.productId && Number(it.qty) > 0)
  if (!form.items.length) {
    message.error('请至少添加一条明细，且数量需大于0')
    return
  }
  try {
    // Ensure submitter exists in Firebase list (kept as string on order)
    const submitterName = (form.submitter || '').trim()
    if (submitterName) {
      try {
        await ensureSubmitter(submitterName)
        // refresh options non-blocking
        listSubmitters().then(list => { submitters.value = list })
      } catch {}
    }
    await save({ id: form.id, billNo: form.billNo, customerCode: form.customerCode, submitter: submitterName || undefined, items: form.items, remark: form.remark, configRequirements: form.configRequirements, attachments: editAttachments.value, expectedShipAt: form.expectedShipAt ? new Date(form.expectedShipAt) : undefined })
    message.success('已保存')
    showEdit.value = false
  } catch (e: any) {
    message.error(e?.message || String(e))
  }
}

function formatTime(v: any) {
  const ms = toMillis(v)
  if (!ms) return ''
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(v: any) {
  const ms = toMillis(v)
  if (!ms) return ''
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}
</script>
