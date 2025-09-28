<template>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">库存管理 · 货品</h1>
      <n-space>
        <n-button type="primary" @click="onCreate" :disabled="loading">新建货品</n-button>
        <n-button type="info" @click="onStartStocktake" :disabled="loading">开始盘点</n-button>
        <n-button @click="load" :loading="loading">刷新</n-button>
      </n-space>
    </div>
    <div class="mt-1 text-gray-500">上次盘点：{{ lastStocktakeText }}</div>

    <div class="mt-3 flex flex-wrap items-end justify-between gap-3">
      <n-space align="end" item-style="display: flex; align-items: end; gap: 8px;">
        <n-input v-model:value="keyword" placeholder="名称" clearable style="width: 220px" />
        <n-input-number v-model:value="stockMin" placeholder="最小库存" :min="0" style="width: 140px" />
        <span class="text-gray-400">-</span>
        <n-input-number v-model:value="stockMax" placeholder="最大库存" :min="0" style="width: 140px" />
        <n-button @click="applyFilter" :loading="loading">搜索</n-button>
        <n-button @click="onClear" :disabled="loading">清空</n-button>
      </n-space>
      <n-space>
        <n-button type="error" :disabled="!selectedIds.length || loading" @click="onBatchDelete">批量删除</n-button>
      </n-space>
    </div>

    <n-alert v-if="error" type="error" class="mt-3">{{ error }}</n-alert>

    <n-spin :show="loading" class="mt-4 w-full">
      <n-data-table
        :columns="columns"
        :data="pagedItems"
        :bordered="false"
        :row-key="rowKey"
        checkable
        v-model:checked-row-keys="selectedIds"
      />
    </n-spin>

    <div class="mt-3 flex justify-end">
      <n-pagination v-model:page="page" :page-size="pageSize" :page-count="pageCount" :page-slot="7" />
    </div>

    <n-modal v-model:show="showEdit" preset="card" :title="editing?.id ? '编辑货品' : '新建货品'" style="max-width: 520px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="96">
        <n-form-item label="货物编号" path="code">
          <n-input v-model:value="form.code" placeholder="唯一编号" />
        </n-form-item>
        <n-form-item label="货物名称" path="name">
          <n-input v-model:value="form.name" placeholder="请输入名称" />
        </n-form-item>
        <n-form-item label="当前库存" path="stock">
          <n-input-number v-model:value="form.stock" :min="0" disabled />
        </n-form-item>
        <n-form-item>
          <div class="text-gray-500 text-sm">库存不可直接编辑，请通过列表中的“入库/出库”进行调整。</div>
        </n-form-item>
        <n-form-item label="启用" path="isActive">
          <n-switch v-model:value="form.isActive" />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="form.remark" type="textarea" :autosize="{ minRows: 2 }" />
        </n-form-item>
        <div class="flex justify-end gap-2 mt-2">
          <n-button @click="showEdit = false">取消</n-button>
          <n-button type="primary" :loading="loading" @click="onSubmit">保存</n-button>
        </div>
      </n-form>
    </n-modal>

    <n-modal v-model:show="showAdjust" preset="card" :title="adjustForm.type === 'IN' ? '入库' : '出库'" style="max-width: 420px">
      <n-form :model="adjustForm" label-placement="left" label-width="88">
        <n-form-item label="数量">
          <n-input-number v-model:value="adjustForm.qty" :min="1" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="adjustForm.remark" placeholder="可选" />
        </n-form-item>
        <div class="flex justify-end gap-2 mt-2">
          <n-button @click="showAdjust = false">取消</n-button>
          <n-button type="primary" :loading="loading" @click="onSubmitAdjust">确认</n-button>
        </div>
      </n-form>
    </n-modal>

    <!-- 盘点弹窗 -->
    <n-modal v-model:show="showStocktake" preset="card" title="开始盘点" style="max-width: 1100px">
      <div class="mb-2 flex items-center gap-3">
        <span class="text-gray-600">说明：修改数量时必须填写备注；提交后会自动生成入库/出库记录并调整库存。</span>
      </div>
      <div style="max-height: 60vh; overflow-y: auto;">
        <n-data-table :columns="stocktakeColumns" :data="stocktakeRows" :bordered="false" :row-key="(r:any)=>r.productId" />
      </div>
      <div class="mt-3 flex items-center gap-2">
        <span class="text-gray-600">本次备注：</span>
        <n-input v-model:value="stocktakeRemark" placeholder="可选，用于本次盘点整体备注" />
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <n-button @click="showStocktake = false">取消</n-button>
        <n-button type="primary" :loading="submittingStocktake" @click="onSubmitStocktake">提交</n-button>
      </div>
    </n-modal>
  </div>
</template>
<script setup lang="ts">
import { NButton, NAlert, NSpin, NDataTable, NModal, NForm, NFormItem, NInput, NInputNumber, NSwitch, NSpace, NPopconfirm, NPagination, useMessage } from 'naive-ui'
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import useProductsVM from '@/vm/inventory/useProductsVM'
import { isProductCodeTaken, adjustProductStock } from '@/repo/inventory/products.repo'
import { createStockRecord } from '@/repo/inventory/stock-records.repo'
import { createStocktake, listStocktakes } from '@/repo/inventory/stocktakes.repo'

const router = useRouter()
const message = useMessage()
const { loading, error, editing, items, load, edit, save, remove, adjust, keyword, stockMin, stockMax, page, pageSize, pageCount, pagedItems, selectedIds, applyFilter, resetFilter, batchRemove } = useProductsVM() as any

// 最近一次盘点时间
const lastStocktakeAt = ref<any>(null)
const lastStocktakeText = computed(() => fmt(lastStocktakeAt.value) || '未盘点')
async function loadLastStocktake() {
  try {
    const arr = await listStocktakes()
    lastStocktakeAt.value = (arr && arr.length) ? arr[0].at : null
  } catch {}
}

onMounted(() => {
  load()
  loadLastStocktake()
})

// 盘点相关
const showStocktake = ref(false)
const submittingStocktake = ref(false)
const stocktakeRows = ref<any[]>([])
const stocktakeRemark = ref('')

function onStartStocktake() {
  // 准备数据快照
  const list = (items?.value || []) as any[]
  stocktakeRows.value = list.map((p: any) => ({
    productId: p.id,
    code: p.code,
    name: p.name,
    beforeQty: Number(p.stock || 0),
    afterQty: Number(p.stock || 0),
    remark: '',
  }))
  showStocktake.value = true
}

const stocktakeColumns = [
  { title: '编号', key: 'code', width: 140 },
  { title: '名称', key: 'name' },
  { title: '当前库存', key: 'beforeQty', width: 100 },
  {
    title: '盘点后数量', key: 'afterQty', width: 140,
    render(row: any) {
      return h(NInputNumber, {
        value: row.afterQty,
        min: 0,
        onUpdateValue(v: number) { row.afterQty = v }
      })
    }
  },
  { title: '差异', key: 'diff', width: 100, render: (row: any) => {
    const diff = Number(row.afterQty || 0) - Number(row.beforeQty || 0)
    const cls = diff === 0 ? '' : (diff > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold')
    return h('span', { class: cls }, String(diff))
  } },
  { title: '备注', key: 'remark', render: (row: any) => h(NInput, { value: row.remark, placeholder: '若有调整请填写原因', onUpdateValue(v: string){ row.remark = v } }) },
]

async function onSubmitStocktake() {
  // 校验变更备注
  const changed = stocktakeRows.value.filter(r => Number(r.afterQty) !== Number(r.beforeQty))
  for (const r of changed) {
    if (!String(r.remark || '').trim()) {
      message.error(`请填写【${r.name}】的修改备注`)
      return
    }
  }
  submittingStocktake.value = true
  try {
    // 逐条调整库存并写入库存记录
    for (const r of changed) {
      const diff = Number(r.afterQty) - Number(r.beforeQty)
      if (diff === 0) continue
      await createStockRecord({
        productId: r.productId,
        type: diff > 0 ? 'IN' : 'OUT',
        qty: Math.abs(diff),
        at: new Date(),
        remark: `盘点调整：${r.remark || ''}`,
        relatedType: 'Manual',
        relatedId: r.productId,
      } as any)
      await adjustProductStock(r.productId, diff)
    }
    // 保存盘点记录
    await createStocktake({
      at: new Date(),
      operator: '',
      remark: stocktakeRemark.value,
      items: stocktakeRows.value.map(r => ({ productId: r.productId, name: r.name, beforeQty: r.beforeQty, afterQty: r.afterQty, diff: Number(r.afterQty) - Number(r.beforeQty), remark: r.remark })),
    } as any)
    message.success('盘点完成')
    showStocktake.value = false
    router.push({ name: 'InventoryStocktakes' })
  } catch (e: any) {
    message.error(e?.message || String(e))
  } finally {
    submittingStocktake.value = false
  }
}

function fmt(dt: any) {
  if (!dt) return ''
  try {
    const ms = dt.seconds ? dt.seconds * 1000 : new Date(dt).getTime()
    const d = new Date(ms)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

function onClear() {
  resetFilter()
}

const rowKey = (row: any) => row.id

const showEdit = ref(false)
const formRef = ref()
const form = reactive<any>({ code: '', name: '', stock: 0, remark: '', isActive: true })

watch(editing, (v) => {
  if (v) {
    Object.assign(form, { id: (v as any).id, code: v.code || '', name: v.name || '', stock: v.stock ?? 0, remark: v.remark || '', isActive: v.isActive ?? true })
  } else {
    Object.assign(form, { id: undefined, code: '', name: '', stock: 0, remark: '', isActive: true })
  }
})

const rules = {
  code: [
    { required: true, message: '请输入编号', trigger: 'blur' },
    {
      async validator(_: any, value: string) {
        if (!value) return true
        const taken = await isProductCodeTaken(value, form.id)
        if (taken) throw new Error('编号已存在')
        return true
      },
      trigger: ['blur', 'change'],
    },
  ],
  name: { required: true, message: '请输入名称', trigger: 'blur' },
}

function onCreate() {
  edit()
  showEdit.value = true
}

function onEdit(row: any) {
  edit(row.id)
  showEdit.value = true
}

async function onSubmit() {
  await (formRef.value as any)?.validate?.()
  try {
    await save(form)
    await load()
    showEdit.value = false
  } catch (e: any) {
    // error 将在 VM 中设置并通过 error alert 展示
  }
}

async function onDelete(row: any) {
  await remove(row.id)
}

async function onBatchDelete() {
  try {
    await batchRemove(selectedIds.value as any)
  } catch {}
}

const showAdjust = ref(false)
const adjustForm = reactive<any>({ productId: '', type: 'IN', qty: 1, remark: '' })

function onAdjust(row: any, type: 'IN' | 'OUT') {
  adjustForm.productId = row.id
  adjustForm.type = type
  adjustForm.qty = 1
  adjustForm.remark = ''
  showAdjust.value = true
}

async function onSubmitAdjust() {
  try {
    await adjust(adjustForm.productId, adjustForm.type, adjustForm.qty, adjustForm.remark)
    showAdjust.value = false
  } catch (e) {
    // 错误通过全局 alert 展示
  }
}


const vm = { batchRemove: useProductsVM().batchRemove }

const columns = computed(() => [
  {
    title: '名称',
    key: 'name',
    render: (row: any) => {
      const stock = Number(row.stock || 0)
      const reserved = Number(row.reservedStock || 0)
      const badges: any[] = []
      if (stock <= 0) {
        badges.push(h('span', { class: 'ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 border border-red-300' }, '缺货'))
      }
      if (reserved > stock) {
        badges.push(h('span', { class: 'ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300' }, '预订超出库存'))
      }
      return h('div', { class: 'flex items-center flex-wrap' }, [
        h('span', { class: 'text-gray-900' }, row.name || ''),
        ...badges,
      ])
    },
  },
  {
    title: '库存',
    key: 'stock',
    render: (row: any) => {
      const stock = Number(row.stock || 0)
      const cls = stock <= 0 ? 'inline-block rounded px-2 py-0.5 bg-red-50 text-red-700 font-extrabold' : ''
      return h('span', { class: cls }, String(stock))
    },
  },
  {
    title: '已预订',
    key: 'reservedStock',
    render: (row: any) => {
      const reserved = Number(row.reservedStock || 0)
      const stock = Number(row.stock || 0)
      const highlight = reserved > stock
      const cls = highlight ? 'inline-block rounded px-2 py-0.5 bg-amber-50 text-amber-700 font-extrabold' : ''
      // 计算预订占库存百分比，并将百分比数字按比例从绿(低)到红(高)着色；当库存为 0 时，仅显示数量。
      const percent = stock > 0 ? Math.round((reserved / stock) * 100) : null
      if (percent === null) {
        const text = String(reserved)
        return h('span', { class: cls }, highlight ? `⚠️ ${text}` : text)
      }
      const capped = Math.max(0, Math.min(100, percent))
      const hue = 120 - (capped / 100) * 120 // 0%->绿色(120)，100%->红色(0)
      const color = `hsl(${Math.round(hue)}, 75%, 40%)`
      const children = [
        `${reserved} (`,
        h('span', { style: { color, fontWeight: '700', fontSize: '12px' } }, `${percent}%`),
        ')',
      ]
      return h('span', { class: cls }, highlight ? ['⚠️ ', ...children] : children)
    },
  },
  {
    title: '在途中',
    key: 'inTransit',
    render: (row: any) => String(Number(row.inTransit || 0)),
  },
  { title: '启用', key: 'isActive', render: (row: any) => (row.isActive ? '是' : '否') },
  { title: '备注', key: 'remark' },
  { title: '更新于', key: 'updatedAt', render: (row: any) => fmt(row.updatedAt) },
  {
    title: '操作',
    key: 'actions',
    render(row: any) {
      return h(NSpace, { size: 8 }, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => onEdit(row) }, { default: () => '编辑' }),
          h(NButton, { size: 'small', tertiary: true, onClick: () => onAdjust(row, 'IN') }, { default: () => '入库' }),
          h(NButton, { size: 'small', tertiary: true, onClick: () => onAdjust(row, 'OUT') }, { default: () => '出库' }),
          h(NButton, { size: 'small', tertiary: true, onClick: () => router.push({ name: 'InventoryStockRecords', query: { productId: row.id } }) }, { default: () => '库存记录' }),
          h(NPopconfirm, { onPositiveClick: () => onDelete(row) }, {
            default: () => '确认删除该货品？',
            trigger: () => h(NButton, { size: 'small', tertiary: true, type: 'error' }, { default: () => '删除' }),
          }),
        ],
      })
    },
  },
])
</script>
