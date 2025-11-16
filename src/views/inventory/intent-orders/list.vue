<template>
  <div class="p-4">
    <div class="text-xl font-medium mb-4">库存管理 · 意向订单</div>

    <n-space class="mb-3" align="center">
      <n-button type="primary" @click="onNew">新建意向订单</n-button>
      <n-button @click="load">刷新</n-button>
    </n-space>

    <!-- 过滤区（单行布局） -->
    <div class="mb-3 grid grid-cols-12 gap-3 items-end">
      <div class="col-span-3">
        <n-form-item label="状态筛选" :label-width="80">
          <n-select
            v-model:value="statusFilter"
            multiple
            clearable
            :options="statusOptions"
            placeholder="选择一个或多个状态"
          />
        </n-form-item>
      </div>
      <div class="col-span-5">
        <n-form-item label="关键词" :label-width="80">
          <n-input v-model:value="q" placeholder="按客户/名称/备注搜索" clearable />
        </n-form-item>
      </div>
      <div class="col-span-3">
        <n-form-item label="预计发货范围" :label-width="100">
          <n-date-picker v-model:value="shipRange" type="daterange" clearable />
        </n-form-item>
      </div>
      <div class="col-span-1 flex justify-end gap-2">
        <n-button tertiary @click="resetFilters">重置筛选</n-button>
      </div>
    </div>

    <n-alert v-if="error" type="error" closable class="mb-3">{{ error }}</n-alert>

    <n-data-table
      :loading="loading"
      :columns="columns"
      :data="pagedItems"
      :row-key="rowKey"
    />

    <div class="mt-3 flex justify-end">
      <n-pagination
        v-model:page="page"
        :page-size="pageSize"
        :page-count="Math.max(1, Math.ceil(filteredItems.length / pageSize))"
      />
    </div>

    <!-- 编辑/新建 -->
    <n-modal v-model:show="showEdit" style="width: 900px">
      <div class="bg-white p-4 rounded">
        <div class="text-lg font-medium mb-3">{{ editing?.id ? '编辑意向订单' : '新建意向订单' }}</div>
        <n-form :model="form" :label-width="120">
          <n-form-item label="客户名称" required>
            <n-input v-model:value="form.customerCode" placeholder="请输入客户名称" />
          </n-form-item>
          <n-form-item label="意向单名称">
            <n-input v-model:value="form.name" placeholder="可选" />
          </n-form-item>
          <n-form-item label="期望发货日期">
            <n-date-picker v-model:value="form.expectedShipAt" type="date" clearable />
          </n-form-item>
          <n-form-item label="备注">
            <n-input v-model:value="form.remark" type="textarea" placeholder="可选" />
          </n-form-item>

          <div class="flex items-center justify-between">
            <n-divider class="!mb-0">货品明细</n-divider>
            <div class="flex items-center gap-2 pl-4">
              <n-button size="small" tertiary @click="openImportBom">从BOM导入</n-button>
            </div>
          </div>
          <div class="flex flex-col gap-2 mt-2">
            <div v-for="(it, i) in form.items" :key="i" class="grid grid-cols-12 gap-2 items-center">
              <div class="col-span-7">
                <n-select v-model:value="it.productId" :options="productOptions" filterable placeholder="选择货品" />
              </div>
              <div class="col-span-3">
                <n-input-number v-model:value="it.qty" :min="1" placeholder="数量" />
              </div>
              <div class="col-span-2 text-right">
                <n-button size="small" @click="removeItem(i)" type="error" tertiary>删除</n-button>
              </div>
            </div>
            <div>
              <n-button size="small" @click="addItem">添加一行</n-button>
            </div>
          </div>
        </n-form>

        <div class="mt-4 flex justify-end gap-2">
          <n-button @click="showEdit=false">取消</n-button>
          <n-button type="primary" :loading="loading" @click="onSave">保存</n-button>
        </div>
      </div>
    </n-modal>

    <!-- 上传报价(Angebot) -->
    <n-modal v-model:show="showQuote" style="width: 600px">
      <div class="bg-white p-4 rounded">
        <div class="text-lg font-medium mb-3">上传报价(Angebot)</div>
        <n-form :label-width="100">
          <n-form-item label="单据编号">
            <n-input v-model:value="quoteBillNo" placeholder="可填写财务单据编号" />
          </n-form-item>
          <n-form-item label="文件">
            <n-upload :default-upload="false" @change="onQuoteUpload">
              <n-button>选择文件并上传</n-button>
            </n-upload>
            <div v-if="quoteUrl" class="text-xs text-gray-500 ml-3 break-all">{{ quoteFileName || fileNameFromUrl(quoteUrl) }}</div>
          </n-form-item>
        </n-form>
        <div class="mt-3 flex justify-end gap-2">
          <n-button @click="showQuote=false">取消</n-button>
          <n-button type="primary" :disabled="!quoteUrl" :loading="loading" @click="confirmQuote">确定</n-button>
        </div>
      </div>
    </n-modal>

    <!-- 上传付款证明 -->
    <n-modal v-model:show="showPayment" style="width: 600px">
      <div class="bg-white p-4 rounded">
        <div class="text-lg font-medium mb-3">上传付款证明</div>
        <n-upload :default-upload="false" multiple @change="onPaymentUpload">
          <n-button>选择文件并上传</n-button>
        </n-upload>
        <ul class="mt-2 text-xs text-gray-600">
          <li v-for="(f, i) in paymentFiles" :key="i" class="break-all">
            <a :href="f.url" target="_blank" download class="text-blue-500 hover:underline">{{ f.name || fileNameFromUrl(f.url) }}</a>
          </li>
        </ul>
        <div class="mt-3 flex justify-end gap-2">
          <n-button @click="showPayment=false">取消</n-button>
          <n-button type="primary" :disabled="!paymentFiles.length" :loading="loading" @click="confirmPayment">确定</n-button>
        </div>
      </div>
    </n-modal>

    <!-- 审核并导出销售订单 -->
    <n-modal v-model:show="showExport" style="width: 520px">
      <div class="bg-white p-4 rounded">
        <div class="text-lg font-medium mb-3">审核并导出销售订单</div>
        <n-form :label-width="120">
          <n-form-item label="收款金额">
            <n-input-number v-model:value="reviewAmount" :min="0" />
          </n-form-item>
        </n-form>
        <div class="mt-3 flex justify-end gap-2">
          <n-button @click="showExport=false">取消</n-button>
          <n-button type="primary" :loading="loading" @click="confirmExport">确认导出</n-button>
        </div>
      </div>
    </n-modal>

    <!-- 关闭意向单 -->
    <n-modal v-model:show="showClose" style="width: 520px">
      <div class="bg-white p-4 rounded">
        <div class="text-lg font-medium mb-3">关闭意向订单</div>
        <n-form :label-width="100">
          <n-form-item label="关闭原因">
            <n-select v-model:value="closeReason" :options="closeReasonOptions" placeholder="请选择或输入" filterable tag />
          </n-form-item>
        </n-form>
        <div class="mt-3 flex justify-end gap-2">
          <n-button @click="showClose=false">取消</n-button>
          <n-button type="primary" :disabled="!closeReason" :loading="loading" @click="confirmClose">确定关闭</n-button>
        </div>
      </div>
    </n-modal>

    <!-- 从BOM导入 -->
    <n-modal v-model:show="showImport" style="width: 720px">
      <div class="bg-white p-4 rounded">
        <div class="text-lg font-medium mb-3">从 BOM 导入明细</div>
        <n-form :label-width="120">
          <n-form-item label="选择BOM">
            <n-select v-model:value="selectedBomId" :options="bomOptions" filterable placeholder="请选择一个BOM" />
          </n-form-item>
        </n-form>
        <div class="text-xs text-gray-500 mb-3" v-if="selectedBom">
          <div class="mb-1">名称：{{ selectedBom.name }}</div>
          <div class="mb-1">明细：{{ selectedBom.items?.length || 0 }} 项</div>
          <div class="max-h-40 overflow-auto border rounded p-2" v-if="selectedBom.items?.length">
            <div v-for="(bi, idx) in selectedBom.items" :key="idx" class="flex justify-between text-xs py-0.5">
              <span class="truncate mr-2">{{ productLabel(bi.productId) || bi.productId }}</span>
              <span class="text-gray-600">x {{ bi.qty }}</span>
            </div>
          </div>
        </div>
        <div class="mt-3 flex justify-end gap-2">
          <n-button @click="showImport=false">取消</n-button>
          <n-button type="primary" :disabled="!selectedBomId" :loading="loading" @click="confirmImport">导入到明细</n-button>
        </div>
      </div>
    </n-modal>

    <!-- 查看/下载文件（报价/付款证明） -->
    <n-modal v-model:show="showFiles" style="width: 720px">
      <div class="bg-white p-4 rounded">
        <div class="text-lg font-medium mb-3">附件查看与下载</div>
        <div v-if="currentFiles.length" class="grid grid-cols-3 gap-3">
          <div v-for="(f, i) in currentFiles" :key="i" class="border rounded p-2 flex flex-col items-start gap-2">
            <template v-if="isImageUrl(f.url)">
              <n-image :src="f.url" width="120" />
              <a :href="f.url" class="text-xs text-blue-500 hover:underline break-all" target="_blank" download>{{ f.name || fileNameFromUrl(f.url) }}</a>
            </template>
            <template v-else>
              <span class="text-xs break-all">{{ f.name || fileNameFromUrl(f.url) }}</span>
              <a :href="f.url" class="text-blue-500 hover:underline text-xs" target="_blank" download>下载</a>
            </template>
          </div>
        </div>
        <div v-else class="text-gray-400">暂无附件</div>
        <div class="mt-4 text-right">
          <n-button @click="showFiles = false">关闭</n-button>
        </div>
      </div>
    </n-modal>

    <!-- 意向订单详情（集中操作入口） -->
    <n-modal v-model:show="showDetail" style="width: 880px">
      <div class="bg-white p-4 rounded">
        <div class="text-lg font-medium mb-3">意向订单详情</div>

        <div v-if="detailOrder" class="grid grid-cols-12 gap-3 text-sm">
          <div class="col-span-6"><span class="text-gray-500">客户：</span>{{ detailOrder.customerCode }}</div>
          <div class="col-span-6"><span class="text-gray-500">名称：</span>{{ detailOrder.name || '-' }}</div>
          <div class="col-span-6 flex items-center gap-2">
            <span class="text-gray-500">状态：</span>
            <n-tag size="small">{{ detailOrder.status }}</n-tag>
          </div>
          <div class="col-span-6"><span class="text-gray-500">预计发货：</span>{{ detailOrder.expectedShipAt || '-' }}</div>
          <div class="col-span-6"><span class="text-gray-500">导出销售单ID：</span>{{ detailOrder.exportedSalesOrderId || '-' }}</div>
          <div class="col-span-6"><span class="text-gray-500">审核金额：</span>{{ detailOrder.reviewedAmount ?? '-' }}</div>
          <div class="col-span-12"><span class="text-gray-500">备注：</span>{{ detailOrder.remark || '-' }}</div>

          <div class="col-span-12">
            <n-divider class="!my-2">货品明细</n-divider>
            <div class="border rounded">
              <div class="grid grid-cols-12 px-2 py-1 text-gray-500">
                <div class="col-span-8">货品</div>
                <div class="col-span-4">数量</div>
              </div>
              <div v-for="(it, idx) in detailOrder.items || []" :key="idx" class="grid grid-cols-12 px-2 py-1 border-t">
                <div class="col-span-8 truncate">{{ productLabel(it.productId) || it.productId }}</div>
                <div class="col-span-4">x {{ it.qty }}</div>
              </div>
            </div>
          </div>

          <div class="col-span-12">
            <n-divider class="!my-2">附件</n-divider>
            <div class="flex flex-wrap gap-3 text-xs">
              <template v-if="detailFiles.length">
                <div v-for="(f, i) in detailFiles" :key="i" class="border rounded p-2">
                  <template v-if="isImageUrl(f.url)">
                    <n-image :src="f.url" width="120" />
                  </template>
                  <div class="mt-1">
                    <a :href="f.url" class="text-blue-500 hover:underline break-all" target="_blank" download>{{ f.name || fileNameFromUrl(f.url) }}</a>
                  </div>
                </div>
              </template>
              <div v-else class="text-gray-400">暂无附件</div>
            </div>
          </div>

          <div class="col-span-12">
            <n-divider class="!my-2">操作</n-divider>
            <div class="flex flex-wrap gap-2">
              <n-button size="small" @click="openQuote(detailOrder)" v-if="detailOrder.status==='SUBMITTED' || !detailOrder.angebotUrl">上传报价</n-button>
              <n-button size="small" type="warning" @click="openPayment(detailOrder)" v-if="detailOrder.status==='QUOTED' || detailOrder.status==='SUBMITTED'">上传付款证明</n-button>
              <n-button size="small" type="primary" @click="openExport(detailOrder)" v-if="detailOrder.status==='PAYMENT_UPLOADED' || detailOrder.status==='QUOTED'">审核并导出</n-button>
              <n-button size="small" type="success" @click="doMarkReceived(detailOrder.id!)" v-if="detailOrder.status==='EXPORTED'">标记到账</n-button>
              <n-button size="small" @click="doArchive(detailOrder.id!)" v-if="detailOrder.status==='RECEIVED'">归档</n-button>
              <n-button size="small" type="error" @click="openClose(detailOrder)" v-if="detailOrder.status!=='CLOSED' && detailOrder.status!=='ARCHIVED' && detailOrder.status!=='RECEIVED'">关闭</n-button>
              <n-button size="small" @click="openFiles(detailOrder)" v-if="detailFiles.length">查看附件</n-button>
              <n-button size="small" @click="openSalesDetail(detailOrder)" v-if="detailOrder.exportedSalesOrderId">销售单详情</n-button>
              <n-button size="small" @click="openSalesFiles(detailOrder)" v-if="detailOrder.exportedSalesOrderId">销售单下载</n-button>
              <n-button size="small" quaternary @click="openEdit(detailOrder)">编辑</n-button>
            </div>
          </div>
        </div>

        <div class="mt-4 text-right">
          <n-button @click="showDetail=false">关闭</n-button>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAlert, NButton, NDataTable, NDatePicker, NDivider, NForm, NFormItem, NImage, NInput, NInputNumber, NModal, NPagination, NPopconfirm, NSelect, NSpace, NUpload, useMessage, NTag } from 'naive-ui'
import useIntentOrdersVM from '@/vm/inventory/useIntentOrdersVM'
import type { IntentOrder, Bom } from '@/repo/inventory/types'
import { listProducts } from '@/repo/inventory/products.repo'
import type { Product } from '@/repo/inventory/types'
import { listBoms } from '@/repo/inventory/boms.repo'
import { uploadFile } from '@/store/aaden/utils.js'
import { getSalesOrder } from '@/repo/inventory/sales-orders.repo'
import { getIntentOrder } from '@/repo/inventory/intent-orders.repo'

const message = useMessage()
const route = useRoute()
const router = useRouter()
const { loading, items, error, load, editing, save, remove, doUploadAngebot, doUploadPayment, doReviewAndExport, doMarkReceived, doArchive, doClose } = useIntentOrdersVM()

onMounted(async () => {
  await load()
  products.value = await listProducts()
  productOptions.value = (products.value || []).map(p => ({ label: `${p.code} · ${p.name}`, value: p.id }))
  const qid = (route.query.detailId as string) || ''
  if (qid) await openDetailById(qid)
})

watch(() => route.query.detailId, async (newId) => {
  const id = (newId as string) || ''
  if (id) await openDetailById(id)
})

const products = ref<Product[]>([])
const productOptions = ref<{ label: string; value: string }[]>([])

// BOM 导入相关
const showImport = ref(false)
const boms = ref<Bom[]>([])
const bomOptions = ref<{ label: string; value: string }[]>([])
const selectedBomId = ref<string | null>(null)
const selectedBom = computed(() => boms.value.find(b => b.id === selectedBomId.value) as Bom | undefined)

function productLabel(pid: string) {
  const opt = productOptions.value.find(p => p.value === pid)
  return opt?.label
}

async function openImportBom() {
  try {
    if (!boms.value.length) {
      boms.value = await listBoms()
      bomOptions.value = (boms.value || []).map(b => ({ label: `${b.name} (${b.items?.length || 0}项)`, value: b.id! }))
    }
    selectedBomId.value = null
    showImport.value = true
  } catch (e: any) {
    message.error(e?.message || String(e))
  }
}

function mergeBomIntoForm(bom: Bom) {
  if (!bom || !Array.isArray(bom.items)) return
  const map = new Map<string, { productId: string; qty: number; remark?: string }>()
  for (const it of (form.items || [])) {
    if (!it?.productId) continue
    map.set(it.productId, { productId: it.productId, qty: Number(it.qty || 0), remark: it.remark })
  }
  for (const bi of bom.items) {
    if (!bi?.productId || !bi.qty || bi.qty <= 0) continue
    const ex = map.get(bi.productId)
    if (ex) ex.qty += bi.qty
    else map.set(bi.productId, { productId: bi.productId, qty: bi.qty })
  }
  form.items = Array.from(map.values()) as any
}

function confirmImport() {
  const bom = selectedBom.value
  if (!bom) return
  mergeBomIntoForm(bom)
  showImport.value = false
}

const rowKey = (row: IntentOrder) => row.id as string

// ----------------------
// Filters
// ----------------------
const statusOptions = [
  { label: '已提交', value: 'SUBMITTED' },
  { label: '意向单已开具', value: 'QUOTED' },
  { label: '已上传付款', value: 'PAYMENT_UPLOADED' },
  { label: '已导出销售单', value: 'EXPORTED' },
  { label: '已到账', value: 'RECEIVED' },
  { label: '已归档', value: 'ARCHIVED' },
  { label: '已关闭', value: 'CLOSED' },
]
const statusFilter = ref<string[] | null>(null)
const q = ref('')
// daterange value in Naive UI is [number, number] | null
const shipRange = ref<[number, number] | null>(null)

function resetFilters() {
  statusFilter.value = null
  q.value = ''
  shipRange.value = null
}

watch([statusFilter, q, shipRange], () => {
  page.value = 1
})

const filteredItems = computed(() => {
  const list = items.value || []
  const statuses = (statusFilter.value || []) as string[]
  const keyword = (q.value || '').trim().toLowerCase()
  const range = shipRange.value
  return list.filter((row) => {
    // status
    if (statuses.length && !statuses.includes(row.status)) return false
    // keyword match: customerCode/name/remark/exportedSalesOrderId
    if (keyword) {
      const hay = [row.customerCode, row.name, row.remark, row.exportedSalesOrderId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(keyword)) return false
    }
    // date range on expectedShipAt if present
    if (range && Array.isArray(range)) {
      const from = range[0]
      const to = range[1]
      const at: any = (row as any).expectedShipAt
      if (at == null) return false
      const ts = typeof at === 'number' ? at : (typeof at?.toMillis === 'function' ? at.toMillis() : Number(new Date(at as any)))
      if (Number.isNaN(ts)) return false
      if (ts < from || ts > to) return false
    }
    return true
  })
})

const columns = [
  { title: '客户', key: 'customerCode' },
  { title: '名称', key: 'name' },
  {
    title: '状态', key: 'status', render(row: IntentOrder) {
      const map: Record<string, { type: any; label: string }> = {
        SUBMITTED: { type: 'default', label: '已提交' },
        QUOTED: { type: 'info', label: '意向单已开具' },
        PAYMENT_UPLOADED: { type: 'warning', label: '已上传付款' },
        EXPORTED: { type: 'success', label: '已导出销售单' },
        RECEIVED: { type: 'success', label: '已到账' },
        ARCHIVED: { type: 'default', label: '已归档' },
        CLOSED: { type: 'error', label: '已关闭' },
      }
      const m = map[row.status]
      return h(NTag, { type: m?.type || 'default' as any, size: 'small' }, { default: () => m?.label || row.status })
    }
  },
  { title: '预计发货', key: 'expectedShipAt' },
  { title: '导出销售单ID', key: 'exportedSalesOrderId' },
  {
    title: '操作', key: 'actions', width: 640,
    render(row: IntentOrder) {
      const btn = (label: string, onClick: () => void, type: any = 'default') => h(NButton, { size: 'small', type, class: 'mr-2', onClick }, { default: () => label })
      const views: any[] = []
      views.push(btn('打开详情', () => openDetail(row)))
      views.push(btn('编辑', () => openEdit(row)))
      views.push(h(
        NPopconfirm,
        { onPositiveClick: () => remove(row.id!) },
        {
          trigger: () => h(NButton, { size: 'small', type: 'error', class: 'mr-2' }, { default: () => '删除' }),
          default: () => '确认删除该意向单？',
        },
      ))
      if (row.status === 'SUBMITTED' || !row.angebotUrl) views.push(btn('上传报价', () => openQuote(row), 'info'))
      if (row.status === 'QUOTED' || row.status === 'SUBMITTED') views.push(btn('上传付款证明', () => openPayment(row), 'warning'))
      // 查看附件（报价与付款凭证）
      if (row.angebotUrl || (row.paymentProofUrls && row.paymentProofUrls.length)) views.push(btn('查看附件', () => openFiles(row)))
      if (row.status === 'PAYMENT_UPLOADED' || row.status === 'QUOTED') views.push(btn('审核并导出', () => openExport(row), 'primary'))
      // 销售单详情/下载
      if (row.exportedSalesOrderId) {
        views.push(btn('销售单详情', () => openSalesDetail(row)))
        views.push(btn('销售单下载', () => openSalesFiles(row)))
      }
      if (row.status === 'EXPORTED') views.push(btn('标记到账', () => doMarkReceived(row.id!), 'success'))
      if (row.status === 'RECEIVED') views.push(btn('归档', () => doArchive(row.id!)))
      if (row.status !== 'CLOSED' && row.status !== 'ARCHIVED' && row.status !== 'RECEIVED') views.push(btn('关闭', () => openClose(row), 'error'))
      return h('div', {}, views)
    }
  }
]

// 分页
const page = ref(1)
const pageSize = 20
const pagedItems = computed(() => filteredItems.value.slice((page.value-1)*pageSize, page.value*pageSize))

// 编辑表单
const showEdit = ref(false)
const form = reactive<IntentOrder>({ customerCode: '', name: '', items: [], remark: '', status: 'SUBMITTED' })
function onNew() { Object.assign(form, { id: undefined, customerCode: '', name: '', items: [], remark: '', expectedShipAt: undefined, status: 'SUBMITTED' }); showEdit.value = true }
function openEdit(row: IntentOrder) { Object.assign(form, JSON.parse(JSON.stringify(row))); showEdit.value = true }
function addItem() { form.items!.push({ productId: productOptions.value[0]?.value as any, qty: 1 }) }
function removeItem(i: number) { form.items!.splice(i, 1) }
async function onSave() {
  try {
    await save({ ...(form as any), id: form.id })
    showEdit.value = false
  } catch (e: any) { message.error(e?.message || String(e)) }
}

// 报价上传
const showQuote = ref(false)
const quoteTarget = ref<IntentOrder | null>(null)
const quoteBillNo = ref('')
const quoteUrl = ref('')
const quoteFileName = ref('')
function openQuote(row: IntentOrder) { quoteTarget.value = row; quoteBillNo.value = row.quoteBillNo || ''; quoteUrl.value = row.angebotUrl || ''; quoteFileName.value = row.quoteOriginalName || ''; showQuote.value = true }
async function onQuoteUpload({ file }: any) {
  const url = await uploadFile(file.file)
  quoteUrl.value = url
  quoteFileName.value = file?.file?.name || ''
}
async function confirmQuote() {
  if (!quoteTarget.value) return
  await doUploadAngebot(quoteTarget.value.id!, quoteUrl.value, quoteBillNo.value, quoteFileName.value)
  showQuote.value = false
}

// 付款证明
type PaymentFile = { url: string; name?: string }
const showPayment = ref(false)
const paymentTarget = ref<IntentOrder | null>(null)
const paymentFiles = ref<PaymentFile[]>([])
function openPayment(row: IntentOrder) {
  paymentTarget.value = row
  // 兼容两种结构
  if (Array.isArray((row as any).paymentProofs) && (row as any).paymentProofs.length) {
    paymentFiles.value = (row as any).paymentProofs.map((f: any) => ({ url: f.url, name: f.name }))
  } else {
    const urls = row.paymentProofUrls || []
    paymentFiles.value = urls.map(u => ({ url: u }))
  }
  showPayment.value = true
}
async function onPaymentUpload({ file }: any) {
  // 每次只处理新增的一个文件
  const url = await uploadFile(file.file)
  const name = file?.file?.name as string | undefined
  const map = new Map(paymentFiles.value.map(f => [f.url, f] as const))
  if (!map.has(url)) map.set(url, { url, name })
  paymentFiles.value = Array.from(map.values())
}
async function confirmPayment() {
  if (!paymentTarget.value) return
  await doUploadPayment(paymentTarget.value.id!, paymentFiles.value as any)
  showPayment.value = false
}

// 导出
const showExport = ref(false)
const exportTarget = ref<IntentOrder | null>(null)
const reviewAmount = ref<number | null>(null)
function openExport(row: IntentOrder) { exportTarget.value = row; reviewAmount.value = row.reviewedAmount || null; showExport.value = true }
async function confirmExport() {
  if (!exportTarget.value) return
  await doReviewAndExport(exportTarget.value.id!, Number(reviewAmount.value || 0))
  showExport.value = false
}

// 关闭
const showClose = ref(false)
const closeTarget = ref<IntentOrder | null>(null)
const closeReason = ref('')
const closeReasonOptions = [
  { label: '客户取消', value: '客户取消' },
  { label: '价格原因', value: '价格原因' },
  { label: '重复下单', value: '重复下单' },
  { label: '其他', value: '其他' },
]
function openClose(row: IntentOrder) { closeTarget.value = row; closeReason.value = row.closeReason || ''; showClose.value = true }
async function confirmClose() { if (!closeTarget.value) return; await doClose(closeTarget.value.id!, closeReason.value); showClose.value = false }

// ----------------------
// 详情弹窗
// ----------------------
const showDetail = ref(false)
const detailOrder = ref<IntentOrder | null>(null)
const detailFiles = computed(() => {
  const row = detailOrder.value
  const arr: { url: string; name?: string }[] = []
  if (!row) return arr
  if (row.angebotUrl) arr.push({ url: row.angebotUrl, name: (row as any).quoteOriginalName })
  if (Array.isArray((row as any).paymentProofs) && (row as any).paymentProofs.length) {
    arr.push(...(row as any).paymentProofs.map((f: any) => ({ url: f.url, name: f.name })))
  } else if (Array.isArray(row.paymentProofUrls)) {
    arr.push(...row.paymentProofUrls.filter(Boolean).map(u => ({ url: u })))
  }
  const dedup = new Map<string, { url: string; name?: string }>()
  for (const f of arr) if (!dedup.has(f.url)) dedup.set(f.url, f)
  return Array.from(dedup.values())
})

function openDetail(row: IntentOrder) {
  detailOrder.value = row
  showDetail.value = true
}

async function openDetailById(id: string) {
  if (!id) return
  let row = (items.value || []).find(x => x.id === id) || null
  if (!row) {
    try { row = (await getIntentOrder(id)) || null } catch {}
  }
  if (!row) {
    message.error('未找到意向订单')
    return
  }
  openDetail(row)
}

// 当列表刷新时，保持详情中的数据为最新
watch(items, () => {
  if (!showDetail.value || !detailOrder.value?.id) return
  const id = detailOrder.value.id
  const latest = (items.value || []).find(x => x.id === id) || null
  if (latest) detailOrder.value = latest
})

// 附件查看/下载
const showFiles = ref(false)
type FileItem = { url: string; name?: string }
const currentFiles = ref<FileItem[]>([])
function openFiles(row: IntentOrder) {
  const arr: FileItem[] = []
  if (row.angebotUrl) arr.push({ url: row.angebotUrl, name: row.quoteOriginalName })
  if (Array.isArray((row as any).paymentProofs) && (row as any).paymentProofs.length) {
    arr.push(...(row as any).paymentProofs.map((f: any) => ({ url: f.url, name: f.name })))
  } else if (Array.isArray(row.paymentProofUrls)) {
    arr.push(...row.paymentProofUrls.filter(Boolean).map(u => ({ url: u })))
  }
  const dedup = new Map<string, FileItem>()
  for (const f of arr) if (!dedup.has(f.url)) dedup.set(f.url, f)
  currentFiles.value = Array.from(dedup.values())
  showFiles.value = true
}

// 销售单：打开详情（在销售订单页以弹窗显示）
function openSalesDetail(row: IntentOrder) {
  if (!row.exportedSalesOrderId) return
  router.push({ name: 'InventorySalesOrders', query: { detailId: row.exportedSalesOrderId as any } })
}

// 销售单：打开附件下载（来源于 SalesOrder.attachments）
async function openSalesFiles(row: IntentOrder) {
  try {
    const id = row.exportedSalesOrderId as any
    if (!id) return
    const so = await getSalesOrder(id)
    const urls = (so?.attachments || []).filter(Boolean)
    if (!urls.length) {
      message.info('该销售单暂无附件，可在详情中上传或下载')
      // 兜底跳到详情
      openSalesDetail(row)
      return
    }
    const files: FileItem[] = urls.map((u: string) => ({ url: u }))
    currentFiles.value = files
    showFiles.value = true
  } catch (e: any) {
    message.error(e?.message || '读取销售单附件失败')
  }
}

function isImageUrl(url: string) {
  return /(\.png|\.jpe?g|\.gif|\.bmp|\.webp|\.svg)(\?.*)?$/i.test(url || '')
}

function fileNameFromUrl(url: string) {
  try {
    const u = new URL(url)
    const name = decodeURIComponent(u.pathname.split('/').pop() || '')
    return name || url
  } catch (e) {
    return url
  }
}

</script>

<style scoped>
</style>
