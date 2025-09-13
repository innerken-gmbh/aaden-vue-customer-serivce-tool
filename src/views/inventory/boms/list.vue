<template>
  <div class="p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">库存管理 · BOM</h1>
      <n-space>
        <n-button type="primary" @click="onCreate" :disabled="loading">新建 BOM</n-button>
        <n-button @click="load" :loading="loading">刷新</n-button>
      </n-space>
    </div>

    <div class="mt-3 flex flex-wrap items-end justify-between gap-3">
      <n-space align="end" item-style="display: flex; align-items: end; gap: 8px;">
        <n-input v-model:value="keyword" placeholder="名称/备注" clearable style="width: 240px" />
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

    <n-modal v-model:show="showEdit" preset="card" :title="editing?.id ? '编辑 BOM' : '新建 BOM'" style="max-width: 720px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="96">
        <n-form-item label="名称" path="name">
          <n-input v-model:value="form.name" placeholder="BOM 名称" />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="form.remark" type="textarea" :autosize="{ minRows: 2 }" />
        </n-form-item>

        <div class="mt-2">
          <div class="font-medium mb-2">物料明细</div>
          <div class="space-y-2">
            <div v-for="(it, idx) in form.items" :key="idx" class="grid grid-cols-12 gap-2 items-center">
              <div class="col-span-6">
                <n-select v-model:value="it.productId" filterable clearable :options="productOptions" placeholder="选择货品" />
              </div>
              <div class="col-span-3">
                <n-input-number v-model:value="it.qty" :min="1" placeholder="数量" />
              </div>
              <div class="col-span-2">
                <n-input v-model:value="it.remark" placeholder="备注(可选)" />
              </div>
              <div class="col-span-1 text-right">
                <n-button size="small" tertiary type="error" @click="removeItem(idx)">删除</n-button>
              </div>
            </div>
            <div>
              <n-button size="small" secondary @click="addItem">+ 添加物料</n-button>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <n-button @click="showEdit = false">取消</n-button>
          <n-button type="primary" :loading="loading" @click="onSubmit">保存</n-button>
        </div>
      </n-form>
    </n-modal>

    <!-- 详情弹窗 -->
    <n-modal v-model:show="showDetail" preset="card" :title="'BOM 详情'" style="max-width: 720px">
      <div class="space-y-2">
        <div><span class="text-gray-500">名称：</span>{{ detailRow?.name }}</div>
        <div v-if="detailRow?.remark"><span class="text-gray-500">备注：</span>{{ detailRow?.remark }}</div>
        <div>
          <div class="text-gray-500 mb-1">物料明细：</div>
          <ul class="list-disc pl-5">
            <li v-for="(it, i) in (detailRow?.items || [])" :key="i">
              {{ it.qty }} × {{ productDict[it.productId]?.label || it.productId }}
              <span v-if="it.remark" class="text-gray-400">（{{ it.remark }}）</span>
            </li>
          </ul>
        </div>
      </div>
    </n-modal>
  </div>
</template>
<script setup lang="ts">
import { NButton, NAlert, NSpin, NDataTable, NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NSpace, NPopconfirm, NPagination } from 'naive-ui'
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import useBomsVM from '@/vm/inventory/useBomsVM'
import type { BomItem } from '@/repo/inventory/types'
import { listProducts } from '@/repo/inventory/products.repo'

const { loading, error, editing, load, edit, save, remove, keyword, page, pageSize, pageCount, pagedItems, selectedIds, applyFilter, resetFilter, batchRemove } = useBomsVM()

onMounted(async () => {
  await load()
  await loadProducts()
})

function onClear() {
  resetFilter()
}

const rowKey = (row: any) => row.id

const showEdit = ref(false)
const formRef = ref()
const form = reactive<any>({ id: undefined, name: '', remark: '', items: [] as BomItem[] })

watch(editing, (v) => {
  if (v) {
    const items = (v.items || []).map((it: any) => ({ productId: it.productId || '', qty: it.qty || 1, remark: it.remark || '' }))
    Object.assign(form, { id: (v as any).id, name: v.name || '', remark: v.remark || '', items })
  } else {
    Object.assign(form, { id: undefined, name: '', remark: '', items: [] })
  }
})

const rules = {
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
  } catch (e) {
    // 错误通过上方 alert 展示
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
const detailRow = ref<any>(null)
function openDetail(row: any) {
  detailRow.value = row
  showDetail.value = true
}

const columns = computed(() => [
  { title: '名称', key: 'name' },
  {
    title: '物料',
    key: 'items',
    render: (row: any) => {
      const list = (row.items || []) as BomItem[]
      if (!list.length) return '—'
      const parts = list
        .map((it: any) => `${it.qty}×${productDict.value[it.productId]?.label || it.productId}`)
        .slice(0, 3)
        .join('、')
      const more = list.length > 3 ? ` 等${list.length}项` : ''
      return h(NButton, { text: true, size: 'small', onClick: () => openDetail(row) }, { default: () => parts + more })
    },
  },
  { title: '备注', key: 'remark' },
  { title: '更新于', key: 'updatedAt', render: (row: any) => fmt(row.updatedAt) },
  {
    title: '操作',
    key: 'actions',
    render(row: any) {
      return h(NSpace, { size: 8 }, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => onEdit(row) }, { default: () => '编辑' }),
          h(NButton, { size: 'small', tertiary: true, onClick: () => openDetail(row) }, { default: () => '详情' }),
          h(NPopconfirm, { onPositiveClick: () => onDelete(row) }, {
            default: () => '确认删除该 BOM？',
            trigger: () => h(NButton, { size: 'small', tertiary: true, type: 'error' }, { default: () => '删除' }),
          }),
        ],
      })
    },
  },
])

// products for select
const productOptions = ref<{ label: string; value: string }[]>([])
const productDict = ref<Record<string, { label: string }>>({})

async function loadProducts() {
  try {
    const ps = await listProducts()
    productOptions.value = ps.map((p: any) => ({ label: (p.name || '').trim() || p.id, value: p.id }))
    const map: Record<string, { label: string }> = {}
    productOptions.value.forEach((o) => (map[o.value] = { label: o.label }))
    productDict.value = map
  } catch (e) {
    // ignore, options will be empty
  }
}

function addItem() {
  form.items.push({ productId: '', qty: 1, remark: '' })
}
function removeItem(idx: number) {
  form.items.splice(idx, 1)
}
</script>
