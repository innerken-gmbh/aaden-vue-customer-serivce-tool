<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">
          流水列表
        </h2>
        <div class="text-sm text-gray-500 mt-1">
          公司：#{{ vm.companyId }}
        </div>
      </div>
      <div class="flex gap-2">
        <n-tooltip
          trigger="hover"
          :disabled="vm.accounts.length > 0"
        >
          <template #trigger>
            <n-button
              type="primary"
              :disabled="vm.accounts.length === 0"
              @click="vm.openUpload"
            >
              上传对账单
            </n-button>
          </template>
          <span>当前公司暂无账户，请先在“账户管理”中创建账户</span>
        </n-tooltip>
        <n-button @click="showBatch = true">
          批量上传附件
        </n-button>
        <n-button
          secondary
          @click="openExportDialog"
        >
          导出对账单
        </n-button>
        <n-button
          v-if="checkedRowKeys.length > 0"
          secondary
          type="primary"
          @click="showBatchAssign = true"
        >
          批量指派负责人 ({{ checkedRowKeys.length }})
        </n-button>
        <n-button
          v-if="checkedRowKeys.length > 0"
          secondary
          @click="showBatchStatus = true"
        >
          批量调整提交状态 ({{ checkedRowKeys.length }})
        </n-button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-7 gap-3">
      <n-select
        v-model:value="vm.filters.accountId"
        :options="vm.accountSelectOptions"
        placeholder="账户"
        :clearable="false"
      />
      <n-select
        v-model:value="vm.filters.statementId"
        :options="vm.statementSelectOptions"
        placeholder="对账单"
        clearable
      />
      <n-input-group>
        <n-input-group-label>负责人</n-input-group-label>
        <n-select
          v-model:value="vm.filters.departmentHeadId"
          :options="vm.departmentHeadSelectOptions"
          placeholder="全部"
          clearable
          filterable
        />
      </n-input-group>
      <n-input-group>
        <n-input-group-label>类型</n-input-group-label>
        <n-select
          v-model:value="vm.filters.type"
          :options="typeOptions"
          placeholder="全部"
          clearable
        />
      </n-input-group>
      <n-input-group>
        <n-input-group-label>提交状态</n-input-group-label>
        <n-select
          v-model:value="vm.filters.submissionStatus"
          :options="submissionStatusOptions"
          placeholder="全部"
          clearable
        />
      </n-input-group>
      <n-date-picker
        v-model:value="vm.filters.dateRange"
        type="daterange"
        clearable
      />
      <n-input
        v-model:value="vm.filters.query"
        placeholder="搜索名称/描述/备注/金额"
      />
    </div>

    <div class="rounded border p-3 flex gap-6 text-sm text-gray-600">
      <div>收入合计：<span class="text-green-600">{{ formatEuro(vm.summary.income) }}</span></div>
      <div>支出合计：<span class="text-red-600">{{ formatEuro(vm.summary.outcome) }}</span></div>
      <div>合计：<span>{{ formatEuro(vm.summary.total) }}</span></div>
    </div>

    <n-spin :show="vm.loading">
      <n-empty
        v-if="!vm.loading && vm.filtered.length === 0"
        description="暂无数据"
      />

      <div v-else>
        <n-data-table
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="vm.filtered"
          :bordered="false"
          :row-props="rowProps"
          :row-key="rowKey"
        />
      </div>
    </n-spin>

    <!-- 批量指派负责人对话框 -->
    <n-modal
      v-model:show="showBatchAssign"
      preset="dialog"
      title="批量指派负责人"
      :mask-closable="false"
      style="width: 520px; max-width: 90vw"
    >
      <div class="space-y-3">
        <div class="text-sm text-gray-600">
          本次将对 <span class="font-semibold">{{ checkedRowKeys.length }}</span> 条流水进行负责人指派。
        </div>
        <n-select
          v-model:value="batchDepartmentHeadId"
          :options="vm.departmentHeadSelectOptions"
          placeholder="请选择负责人"
          clearable
          filterable
        />
        <n-alert
          v-if="vm.departmentHeadSelectOptions.length === 0"
          type="warning"
          class="mt-1"
        >
          当前公司暂无负责人，请先到公司设置中添加负责人。
        </n-alert>
      </div>
      <template #action>
        <n-button
          :disabled="batchAssignLoading"
          @click="showBatchAssign = false"
        >
          取消
        </n-button>
        <n-button
          type="primary"
          :loading="batchAssignLoading"
          :disabled="!batchDepartmentHeadId"
          @click="onBatchAssignDepartmentHead"
        >
          确定指派
        </n-button>
      </template>
    </n-modal>

    <!-- 批量调整提交状态对话框 -->
    <n-modal
      v-model:show="showBatchStatus"
      preset="dialog"
      title="批量调整提交状态"
      :mask-closable="false"
      style="width: 520px; max-width: 90vw"
    >
      <div class="space-y-3">
        <div class="text-sm text-gray-600">
          将对 <span class="font-semibold">{{ checkedRowKeys.length }}</span> 条流水统一设置提交状态。
        </div>
        <n-select
          v-model:value="batchStatus"
          :options="batchStatusOptions as any"
          placeholder="请选择状态"
          clearable
        />
        <n-alert type="info">
          仅可设置为：待提交、免提交、无效票据。已提交状态只能通过“上传附件/票据”产生。
        </n-alert>
      </div>
      <template #action>
        <n-button
          :disabled="batchStatusLoading"
          @click="showBatchStatus = false"
        >
          取消
        </n-button>
        <n-button
          type="primary"
          :loading="batchStatusLoading"
          :disabled="!batchStatus"
          @click="onBatchChangeStatus"
        >
          确定更新
        </n-button>
      </template>
    </n-modal>

    <!-- 上传对账单（合并自原对账单页面） -->
    <n-modal
      v-model:show="vm.showUpload"
      preset="card"
      title="上传对账单"
      :mask-closable="false"
      style="width: 680px; max-width: 90vw"
      content-style="max-height: 70vh; overflow: auto"
    >
      <n-form
        ref="formRef"
        :model="vm.form"
        :rules="vm.rules"
        label-width="96"
      >
        <n-form-item
          label="账户"
          path="accountId"
        >
          <n-select
            v-model:value="vm.form.accountId"
            :options="vm.accountSelectOptions"
            placeholder="请选择账户"
            clearable
          />
        </n-form-item>
        <n-form-item
          label="描述"
          path="description"
        >
          <n-input
            v-model:value="vm.form.description"
            type="textarea"
            placeholder="可选"
          />
        </n-form-item>
        <n-alert
          type="info"
          class="mb-2"
        >
          无需选择起止日期，系统将自动识别对账单日期范围（AI 解析）。
        </n-alert>
        <n-form-item
          label="文件"
          path="file"
        >
          <n-upload
            accept="application/pdf"
            :max="1"
            :show-file-list="false"
            :default-upload="false"
            class="w-full"
            @before-upload="onBeforeStatementUpload"
          >
            <n-upload-dragger>
              <div class="py-6 text-center">
                <div class="text-gray-600">
                  将 PDF 拖拽到此处，或点击选择文件
                </div>
                <div
                  v-if="vm.form.file"
                  class="text-xs text-gray-500 mt-2 truncate"
                >
                  已选择：{{ (vm.form.file as any)?.name }}
                </div>
              </div>
            </n-upload-dragger>
          </n-upload>
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="vm.showUpload = false">
            取消
          </n-button>
          <n-button
            type="primary"
            :loading="vm.uploading"
            @click="onSubmit"
          >
            开始上传
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 单条上传对话框（简单使用原生 file input 作为占位） -->
    <n-modal
      v-model:show="showSingle"
      preset="dialog"
      title="上传附件"
      style="width: 480px; max-width: 90vw"
      content-style="max-height: 70vh; overflow: auto"
    >
      <n-upload
        accept="application/pdf,image/*"
        :max="1"
        :show-file-list="false"
        :default-upload="false"
        @before-upload="onBeforeSingleUpload"
      >
        <n-button type="primary">
          选择文件
        </n-button>
      </n-upload>
      <div class="mt-2 text-xs text-gray-500">
        支持 PDF 或图片格式
      </div>
      <template #action>
        <n-button @click="showSingle = false">
          关闭
        </n-button>
      </template>
    </n-modal>

    <!-- 编辑交易（已抽离成独立组件） -->
    <EditTransactionDialog
      v-model:show="showEdit"
      :transaction="editingRow"
      :department-head-options="vm.departmentHeadSelectOptions"
      @saved="onEditSaved"
    />

    <!-- 附件预览 -->
    <n-modal
      v-model:show="showPreview"
      preset="card"
      :title="previewTitle"
      :mask-closable="true"
      style="width: 900px; max-width: 95vw"
      content-style="max-height: 80vh; overflow: auto"
    >
      <div
        v-if="!previewUrl"
        class="text-gray-500"
      >
        暂无可预览的附件
      </div>
      <div v-else>
        <div
          v-if="previewType === 'image'"
          class="w-full flex justify-center"
        >
          <img
            :src="previewUrl!"
            :alt="previewTitle"
            style="max-width: 100%; max-height: 72vh; object-fit: contain;"
          >
        </div>
        <div
          v-else-if="previewType === 'pdf'"
          class="w-full"
        >
          <iframe
            :src="previewUrl!"
            type="application/pdf"
            style="width: 100%; height: 72vh; border: none;"
          />
        </div>
        <div
          v-else
          class="text-gray-600"
        >
          当前文件类型暂不支持内联预览。
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button
            :disabled="!originalUrl && !previewUrl"
            @click="openInNewTab"
          >
            在新标签打开
          </n-button>
          <n-button
            :disabled="!originalUrl && !previewUrl"
            @click="downloadCurrent"
          >
            下载
          </n-button>
          <n-button
            type="primary"
            @click="showPreview = false"
          >
            关闭
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 导出对账单对话框 -->
    <n-modal
      v-model:show="showExport"
      preset="dialog"
      title="导出对账单"
      :mask-closable="false"
      style="width: 520px; max-width: 90vw"
    >
      <div class="space-y-3">
        <n-input-group>
          <n-input-group-label>账户</n-input-group-label>
          <n-select
            v-model:value="exportAccountId"
            :options="vm.accountSelectOptions"
            :disabled="vm.accounts.length <= 1"
            placeholder="选择账户"
            @update:value="onExportAccountChange"
          />
        </n-input-group>
        <n-select
          v-model:value="exportStatementId"
          :options="exportStatementOptions"
          :loading="exportLoading"
          placeholder="请选择对账单"
          clearable
        />
        <n-alert
          v-if="exportStatementOptions.length === 0 && !exportLoading"
          type="warning"
        >
          当前账户暂无对账单可导出。
        </n-alert>
      </div>
      <template #action>
        <n-button
          :disabled="exportLoading"
          @click="showExport = false"
        >
          取消
        </n-button>
        <n-button
          type="primary"
          :loading="exportLoading"
          :disabled="!exportStatementId"
          @click="onConfirmExport"
        >
          下载导出
        </n-button>
      </template>
    </n-modal>

    <!-- 批量上传（两步：分析 → 应用） 抽离到独立组件 -->
    <BatchAttachmentsDialog
      v-model:show="showBatch"
      @applied="onBatchApplied"
    />
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref, watch, reactive, computed } from 'vue'
import type { FormInst, UploadFileInfo } from 'naive-ui'
import { NTag } from 'naive-ui'
import { useReconTransactionsStore } from '@/vm/reconciliation/recon-transactions'
import type { BankTransactionDTO, BankStatementDTO } from '@/repo/reconciliation/types'
import { listStatementsByAccount, exportStatementZip } from '@/repo/reconciliation/statement.repo'
import BatchAttachmentsDialog from './components/BatchAttachmentsDialog.vue'
import EditTransactionDialog from './components/EditTransactionDialog.vue'
import { openDownloadViaProxy, getDownloadProxyUrl } from '@/utils/download'

const vm = useReconTransactionsStore()
const formRef = ref<FormInst | null>(null)

// Upload validators / handlers for Naive UI upload
function acceptPdf(file: File | null | undefined): boolean {
  if (!file) return false
  const name = file.name?.toLowerCase?.() || ''
  return file.type === 'application/pdf' || name.endsWith('.pdf')
}
function setPickedFile(file: File | null) {
  if (!file) {
    vm.form.file = null
    return
  }
  if (!acceptPdf(file)) {
    window.$message?.error?.('仅支持 PDF 文件')
    return
  }
  vm.form.file = file
}
// For statement modal: intercept n-upload and set vm.form.file
function onBeforeStatementUpload({ file }: { file: UploadFileInfo }) {
  const raw = file.file
  if (!raw) return false
  if (!acceptPdf(raw)) {
    window.$message?.error?.('仅支持 PDF 文件')
    return false
  }
  vm.form.file = raw
  // prevent n-upload from making an HTTP request
  return false
}

// 初始化加载：先加载账户列表并使用账户拉取流水
onMounted(() => {
  vm.load()
})

// 账户筛选变更时，强制保持有值并按账户重新加载数据
watch(
  () => vm.filters.accountId,
  (id, oldVal) => {
    if (id == null) {
      const first = vm.accounts?.[0]?.id
      if (first != null) {
        vm.filters.accountId = first
        // 保存默认选择
        try {
          window.localStorage.setItem(`recon.selectedAccount.${vm.companyId}`, String(first))
        } catch {}
      }
      return
    }
    // 避免在初次赋值后重复请求
    if (oldVal == null) {
      // 首次赋值也持久化
      try {
        window.localStorage.setItem(`recon.selectedAccount.${vm.companyId}`, String(id))
      } catch {}
      return
    }
    // 持久化选择并按账户重新加载
    try {
      window.localStorage.setItem(`recon.selectedAccount.${vm.companyId}`, String(id))
    } catch {}
    vm.reloadByAccount(id as number)
  }
)

// 确保账户选择的值为 number 类型，避免字符串导致校验失败
function onAccountChange(val: unknown) {
  vm.form.accountId = typeof val === 'string' ? Number(val) : (val as number | null)
}

// 每次打开弹窗时重置上一次的校验提示
watch(
  () => vm.showUpload,
  (show) => {
    if (show) {
      // 延迟到下一个 tick，等待表单渲染完成
      setTimeout(() => formRef.value?.restoreValidation(), 0)
    }
  }
)

const typeOptions = [
  { label: '全部', value: '' },
  { label: '收入', value: 'INCOME' },
  { label: '支出', value: 'OUTCOME' },
]
const submissionStatusOptions = [
  { label: '全部', value: '' },
  { label: '已提交', value: 'SUBMITTED' },
  { label: '待提交', value: 'WAITING' },
  { label: '免提交', value: 'NOT_REQUIRED' },
  { label: '无效票据', value: 'INVALID_CONTENT' },
]

// 表格多选与批量负责人设置
const checkedRowKeys = ref<Array<number | string>>([])
const batchDepartmentHeadId = ref<number | null>(null)
const showBatchAssign = ref(false)
const batchAssignLoading = ref(false)
// 批量修改提交状态
const showBatchStatus = ref(false)
const batchStatus = ref<'WAITING' | 'NOT_REQUIRED' | 'INVALID_CONTENT' | null>(null)

// 导出对话框状态
const showExport = ref(false)
const exportLoading = ref(false)
const exportAccountId = ref<number | null>(null)
const exportStatementId = ref<number | null>(null)
const exportStatements = ref<BankStatementDTO[]>([])
const exportStatementOptions = computed(() =>
  (exportStatements.value || []).map(s => ({
    label: `#${s.id} ${s.name}（${s.startDate} ~ ${s.endDate}）`,
    value: s.id,
  }))
)

function openExportDialog() {
  // 预设账户：优先使用筛选中的账户
  const aid = (vm.filters.accountId as number) || vm.accounts?.[0]?.id || null
  exportAccountId.value = aid
  exportStatementId.value = null
  exportStatements.value = []
  showExport.value = true
  if (aid) {
    void loadExportStatements(aid)
  }
}

async function onExportAccountChange(aid: number | null) {
  exportStatementId.value = null
  exportStatements.value = []
  if (!aid) return
  await loadExportStatements(aid)
}

async function loadExportStatements(aid: number) {
  exportLoading.value = true
  try {
    const list = await listStatementsByAccount(aid)
    exportStatements.value = list || []
  } finally {
    exportLoading.value = false
  }
}

function parseDispositionFilename(disposition: string | undefined | null): string | null {
  if (!disposition) return null
  // content-disposition: attachment; filename="statement#123.zip"; filename*=UTF-8''statement%23123.zip
  // Try filename* first
  const star = /filename\*=UTF-8''([^;]+)\s*/i.exec(disposition)
  if (star && star[1]) {
    try {
      return decodeURIComponent(star[1])
    } catch {}
  }
  const m = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition)
  return m && m[1] ? m[1] : null
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function onConfirmExport() {
  if (!exportStatementId.value) return
  exportLoading.value = true
  try {
    const res = await exportStatementZip(exportStatementId.value)
    const blob: Blob = res.data as Blob
    const cd = (res.headers?.['content-disposition'] as string | undefined) || (res.headers?.['Content-Disposition'] as string | undefined)
    let filename = parseDispositionFilename(cd) || `statement#${exportStatementId.value}.zip`
    // 防止路径分隔符
    filename = filename.replace(/[\\\/]+/g, '_')
    triggerBlobDownload(blob, filename)
    window.$message?.success?.('导出任务已开始，若未自动下载，请检查浏览器拦截。')
    showExport.value = false
  } catch (e: any) {
    console.error('Export failed', e)
    window.$message?.error?.(e?.message || '导出失败，请稍后重试')
  } finally {
    exportLoading.value = false
  }
}
const batchStatusLoading = ref(false)
const batchStatusOptions = [
  { label: '待提交', value: 'WAITING' },
  { label: '免提交', value: 'NOT_REQUIRED' },
  { label: '无效票据', value: 'INVALID_CONTENT' },
] as const

const rowKey = (row: BankTransactionDTO) => row.id

async function onBatchAssignDepartmentHead() {
  if (!batchDepartmentHeadId.value || checkedRowKeys.value.length === 0) {
    return
  }
  const idsSet = new Set(checkedRowKeys.value)
  const targets = vm.list.filter(t => idsSet.has(t.id))
  try {
    batchAssignLoading.value = true
    const tasks = targets.map(t => vm.saveTransactionEdit({
      id: t.id,
      statementId: t.statementId,
      name: t.name,
      description: (t.description ?? null) as string | null,
      date: t.date, // already ISO LocalDate
      amount: Number(t.amount),
      transactionType: t.transactionType,
      expenseType: t.transactionType === 'OUTCOME' ? (t.expenseType ?? null) : null,
      departmentHeadId: batchDepartmentHeadId.value as number,
      tag: (t.tag ?? null) as string | null,
      submissionStatus: t.submissionStatus,
      fileUrl: (t.fileUrl ?? null) as string | null,
      fileName: (t.fileName ?? null) as string | null,
      categoryNote: (t.categoryNote ?? null) as string | null,
    } as any))
    await Promise.allSettled(tasks)
    window.$message?.success?.(`已为 ${targets.length} 条流水指派负责人`)
    showBatchAssign.value = false
  } catch (e: any) {
    window.$message?.error?.(e?.message || '批量指派失败')
  } finally {
    batchAssignLoading.value = false
    // 清理选择
    checkedRowKeys.value = []
    // 保留已选负责人，方便继续批量设置；如需清空，可取消下一行注释
    // batchDepartmentHeadId.value = null
  }
}

async function onBatchChangeStatus() {
  if (!batchStatus.value || checkedRowKeys.value.length === 0) return
  const idsSet = new Set(checkedRowKeys.value)
  const targets = vm.list.filter(t => idsSet.has(t.id))
  try {
    batchStatusLoading.value = true
    const tasks = targets.map(t => vm.saveTransactionEdit({
      id: t.id,
      statementId: t.statementId,
      name: t.name,
      description: (t.description ?? null) as string | null,
      date: t.date,
      amount: Number(t.amount),
      transactionType: t.transactionType,
      expenseType: t.transactionType === 'OUTCOME' ? (t.expenseType ?? null) : null,
      departmentHeadId: t.departmentHead?.id ?? null,
      tag: (t.tag ?? null) as string | null,
      submissionStatus: batchStatus.value,
      fileUrl: (t.fileUrl ?? null) as string | null,
      fileName: (t.fileName ?? null) as string | null,
      categoryNote: (t.categoryNote ?? null) as string | null,
    } as any))
    await Promise.allSettled(tasks)
    window.$message?.success?.(`已更新 ${targets.length} 条流水的提交状态`)
    showBatchStatus.value = false
  } catch (e: any) {
    window.$message?.error?.(e?.message || '批量更新提交状态失败')
  } finally {
    batchStatusLoading.value = false
    checkedRowKeys.value = []
    // 保留 batchStatus 以便继续操作，如需重置请取消注释
    // batchStatus.value = null
  }
}

const showSingle = ref(false)
const showBatch = ref(false)
// 关闭批量对话框时，重置选择与预览
const singleTxId = ref<number | null>(null)

function openSingleUpload(row: BankTransactionDTO) {
  singleTxId.value = row.id
  showSingle.value = true
}

function isAllowedAttachment(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  if (type === 'application/pdf' || type.startsWith('image/')) return true
  const name = (file.name || '').toLowerCase()
  return name.endsWith('.pdf') || /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/.test(name)
}

async function onBeforeSingleUpload({ file }: { file: UploadFileInfo }) {
  const raw = file.file
  if (!raw) return false
  if (!isAllowedAttachment(raw)) {
    window.$message?.error?.('仅支持 PDF 或图片文件')
    return false
  }
  if (!singleTxId.value) {
    window.$message?.error?.('未选择流水记录')
    return false
  }
  try {
    await vm.uploadAttachment(singleTxId.value, raw)
    window.$message?.success?.('上传成功')
    showSingle.value = false
  } catch (e: any) {
    window.$message?.error?.(e?.message || '上传失败')
  }
  // prevent n-upload from auto uploading
  return false
}

// 编辑弹窗（状态保留在父组件，仅负责打开与传入行）
const showEdit = ref(false)
const editingRow = ref<BankTransactionDTO | null>(null)

function openEdit(row: BankTransactionDTO) {
  editingRow.value = row
  showEdit.value = true
}

function onEditSaved() {
  // 子组件已保存并给出提示；如需刷新列表，这里可以调用 vm.reloadByAccount 或 vm.load()
}

// 附件预览状态与工具
const showPreview = ref(false)
const previewTitle = ref('附件预览')
// 预览用到的 URL：优先使用 blob/object URL，避免服务端 Content-Disposition: attachment 强制下载
const previewUrl = ref<string | null>(null)
// 原始文件直链（用于“在新标签打开/下载”兜底）
const originalUrl = ref<string | null>(null)
const previewType = ref<'image' | 'pdf' | 'other'>('other')

function detectPreviewTypeByName(urlOrName: string): 'image' | 'pdf' | 'other' {
  const name = (urlOrName || '').toLowerCase()
  if (/(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)(\?|#|$)/.test(name)) return 'image'
  if (/(\.pdf)(\?|#|$)/.test(name)) return 'pdf'
  return 'other'
}

function detectPreviewTypeByMime(mime?: string | null): 'image' | 'pdf' | 'other' {
  if (!mime) return 'other'
  if (mime.startsWith('image/')) return 'image'
  if (mime.includes('pdf')) return 'pdf'
  return 'other'
}

// 清理 object URL，避免内存泄漏
function revokePreviewUrl() {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
}

async function openPreview(row: BankTransactionDTO) {
  revokePreviewUrl()
  originalUrl.value = row.fileUrl || null
  previewTitle.value = row.fileName || '附件预览'
  previewType.value = 'other'

  if (!row.fileUrl) {
    showPreview.value = true
    return
  }

  // 始终通过后端代理获取为 Blob，并在弹窗中使用 blob: URL 进行内联预览。
  // 注意：不要把 iframe/img 导航到直链或代理链接，否则若服务端返回 Content-Disposition: attachment 会触发浏览器直接下载。
  try {
    const proxyUrl = getDownloadProxyUrl(row.fileUrl)
    const res = await fetch(proxyUrl, { credentials: 'include' })
    if (!res.ok) throw new Error('网络错误')
    const mime = res.headers.get('content-type')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    previewUrl.value = url
    // 先用 MIME 判断，其次回退到文件名
    previewType.value = detectPreviewTypeByMime(mime) || detectPreviewTypeByName(row.fileName || row.fileUrl)
  } catch (e) {
    // 失败时，不要回退到直链，避免自动下载。仅提示不支持内联预览，保留原始链接供“新标签打开/下载”。
    previewUrl.value = null
    previewType.value = detectPreviewTypeByName(row.fileName || row.fileUrl) || 'other'
  }
  showPreview.value = true
}

function openInNewTab() {
  const orig = originalUrl.value
  const blobUrl = previewUrl.value
  if (orig) {
    // Use backend proxy to avoid CORS and ensure correct headers/filename
    openDownloadViaProxy(orig, { newTab: true })
    return
  }
  if (blobUrl) {
    // For locally created blob previews, open directly
    window.open(blobUrl, '_blank')
  }
}

function downloadCurrent() {
  const orig = originalUrl.value
  const blobUrl = previewUrl.value
  if (!orig && !blobUrl) return
  if (orig) {
    // Use backend proxy for direct file URLs to avoid CORS and get correct filename
    openDownloadViaProxy(orig)
    return
  }
  // Fallback for locally created blob previews
  const a = document.createElement('a')
  a.href = blobUrl!
  a.download = previewTitle.value || 'attachment'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// 当关闭弹窗时，释放 blob URL
watch(
  () => showPreview.value,
  (v) => {
    if (!v) revokePreviewUrl()
  }
)

function onBatchApplied() {
  // 子组件已经完成应用与提示，这里保持占位以便父层后续扩展（例如刷新其他区域）
}

function onPickFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files ? input.files[0] : null
  setPickedFile(file)
}

async function onSubmit() {
  try {
    // 先进行表单校验
    await formRef.value?.validate()
    await vm.submitUpload()
    window.$message?.success?.('上传成功')
  } catch (e: any) {
    // naive-ui 校验失败会抛出 Error，直接提示
    window.$message?.error?.(e?.message || '上传失败')
  }
}

const tail = (no: string) => (no ? String(no).slice(-4) : '')

// Euro currency formatter (German locale for € format like 1.234,56 €)
const euroFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
function formatEuro(value: number | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return euroFormatter.format(0)
  return euroFormatter.format(n)
}

const columns = [
  { type: 'selection' },
  { title: '日期', key: 'date', className: 'col-date' },
  {
    title: '对账单ID',
    key: 'statementId',
    render: (row: BankTransactionDTO) => {
      const sid = row.statementId != null ? `#${row.statementId}` : '-'
      const note = typeof row.categoryNote === 'string' && row.categoryNote.trim().length > 0 ? row.categoryNote.trim() : ''
      return note ? `${sid}/${note}` : sid
    },
  },
  {
    title: '名称',
    key: 'name',
    render: (row: BankTransactionDTO) =>
      h('div', { class: 'flex flex-col max-w-[420px]' }, [
        h('div', { class: 'font-medium text-gray-900 truncate' }, (row.name || '-')),
        row.description
          ? h('div', { class: 'text-xs text-gray-500 mt-1 line-clamp-2 break-words' }, row.description)
          : null,
      ]),
  },
  { title: '备注', key: 'note', render: (row: BankTransactionDTO) => (row.note && row.note.trim().length > 0)
      ? h('div', { class: 'text-xs text-gray-600 max-w-[360px] line-clamp-2 break-words' }, row.note)
      : '-' },
  { title: '金额', key: 'amount', render: (row: BankTransactionDTO) => h('span', { class: (row.amount >= 0 ? 'text-green-600' : 'text-red-600') + ' whitespace-nowrap tabular-nums' }, formatEuro(row.amount)) },
  {
    title: '类型',
    key: 'typeMerged',
    render: (row: BankTransactionDTO) => {
      // 构造类型标签
      let typeTag: any
      if (row.transactionType === 'INCOME') {
        typeTag = h(NTag, { size: 'small', type: 'success', round: true }, { default: () => '收入' })
      } else {
        // OUTCOME
        const et = row.expenseType
        if (et === 'MANAGEMENT') {
          typeTag = h(NTag, { size: 'small', type: 'warning', round: true }, { default: () => '管理支出' })
        } else if (et === 'PRODUCTION') {
          typeTag = h(NTag, { size: 'small', type: 'error', round: true }, { default: () => '生产支出' })
        } else {
          // fallback: 未标注费用类型，按支出处理
          typeTag = h(NTag, { size: 'small', type: 'error', round: true }, { default: () => '支出' })
        }
      }
      // 否则仅展示标签
      return typeTag
    },
  },
  { title: '负责人', key: 'departmentHead', render: (row: BankTransactionDTO) => row.departmentHead?.name || '-' },
  {
    title: '附件/提交',
    key: 'attachmentStatus',
    render: (row: BankTransactionDTO) => {
      const children: any[] = []
      // 合并“提交状态 + 附件”到一个标签里
      const status = row.submissionStatus
      const statusText = status === 'SUBMITTED' ? '已提交' : status === 'WAITING' ? '待提交' : status === 'NOT_REQUIRED' ? '免提交' : status === 'INVALID_CONTENT' ? '无效票据' : '未知'
      const tagType = status === 'SUBMITTED' ? 'success' : status === 'WAITING' ? 'warning' : status === 'INVALID_CONTENT' ? 'error' : 'default'
      const tagContent = row.fileUrl
        ? [
            statusText,
            ' · ',
            h(
              'a',
              {
                href: row.fileUrl,
                target: '_blank',
                class: 'underline text-current',
                style: 'color: inherit',
                onClick: (e: MouseEvent) => {
                  // 支持按住修饰键打开新标签，普通点击则弹出预览
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                  e.preventDefault()
                  openPreview(row)
                },
              },
              row.fileName || '查看'
            ),
          ]
        : [statusText, ' · 无附件']
      children.push(
        h(
          NTag,
          { size: 'small', type: tagType as any, round: true, class: 'mr-2' },
          { default: () => h('span', { class: 'inline-flex items-center' }, tagContent as any) }
        )
      )
      // 操作：编辑 + 上传附件
      children.push(
        h('a', { class: 'text-primary cursor-pointer mr-3', onClick: () => openEdit(row) }, '编辑')
      )
      children.push(
        h('a', { class: 'text-primary cursor-pointer', onClick: () => openSingleUpload(row) }, '上传附件')
      )
      return h('div', { class: 'flex items-center flex-wrap gap-1' }, children)
    },
  }
]


// 行配色规则（与右侧提交状态标签颜色保持一致）：
// - NOT_REQUIRED（免提交）：透明/无底色
// - WAITING（待提交）：黄色底
// - INVALID_CONTENT（无效票据）：红色底
// - SUBMITTED（已提交）：绿色底
const rowProps = (row: BankTransactionDTO) => {
  const status = row.submissionStatus
  switch (status) {
    case 'NOT_REQUIRED':
      return { class: 'row-gray' }
    case 'WAITING':
      return { class: 'row-warning' }
    case 'INVALID_CONTENT':
      return { class: 'row-error' }
    case 'SUBMITTED':
      return { class: 'row-success' }
    default:
      return { class: '' }
  }
}
</script>

<style>
/* 与提交状态标签保持一致的日期列底色（近似 Tailwind 100 阶）*/
/* 成功（绿色） */
.n-data-table .row-success .col-date {
  background-color: #dcfce7; /* green-100 */
}
/* 警告（黄色/琥珀） */
.n-data-table .row-warning .col-date {
  background-color: #fef3c7; /* amber-100 */
}
/* 错误（红色） */
.n-data-table .row-error .col-date {
  background-color: #fee2e2; /* red-100 */
}
/* 免提交（NOT_REQUIRED）：透明/无底色 */
.n-data-table .row-gray .col-date {
  background-color: transparent;
}

</style>
