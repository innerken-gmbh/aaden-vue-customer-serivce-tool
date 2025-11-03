<template>
  <n-modal
    v-model:show="showLocal"
    preset="card"
    title="编辑流水"
    :mask-closable="false"
    style="width: 680px; max-width: 90vw"
    content-style="max-height: 70vh; overflow: auto"
  >
    <n-form
      ref="editFormRef"
      :model="editForm"
      :rules="editRules"
      label-width="96"
    >
      <n-form-item label="名称" path="name">
        <n-input
          v-model:value="editForm.name"
          maxlength="120"
          show-count
          placeholder="请输入名称"
        />
      </n-form-item>
      <n-form-item label="描述" path="description">
        <n-input
          v-model:value="editForm.description"
          type="textarea"
          placeholder="可选"
        />
      </n-form-item>
      <n-form-item label="备注" path="note">
        <n-input
          v-model:value="editForm.note"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 4 }"
          maxlength="1000"
          show-count
          placeholder="可选，最多1000字"
        />
      </n-form-item>
      <n-form-item label="日期" path="date">
        <n-date-picker v-model:value="editForm.date" type="date" />
      </n-form-item>
      <n-form-item label="金额" path="amount">
        <n-input-number
          v-model:value="editForm.amount"
          :precision="2"
          :min="-999999999"
          :max="999999999"
        />
      </n-form-item>
      <n-form-item label="类型" path="transactionType">
        <n-select
          v-model:value="editForm.transactionType"
          :options="[
            { label: '收入', value: 'INCOME' },
            { label: '支出', value: 'OUTCOME' },
          ]"
        />
      </n-form-item>
      <n-form-item v-if="editForm.transactionType === 'OUTCOME'" label="费用类型" path="expenseType">
        <n-select
          v-model:value="editForm.expenseType"
          :options="[
            { label: '生产', value: 'PRODUCTION' },
            { label: '管理', value: 'MANAGEMENT' },
          ]"
          clearable
        />
      </n-form-item>
      <n-form-item label="分类备注" path="categoryNote">
        <n-input
          v-model:value="editForm.categoryNote"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 4 }"
          placeholder="可填写或修改分类备注"
        />
        <template #feedback>
          可手动编辑该备注，保存后将覆盖由分类规则生成的内容。
        </template>
      </n-form-item>
      <n-form-item label="负责人" path="departmentHeadId">
        <n-select
          v-model:value="editForm.departmentHeadId"
          :options="departmentHeadOptions"
          placeholder="请选择负责人"
          clearable
          filterable
        />
      </n-form-item>
    </n-form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <n-button @click="close">取消</n-button>
        <n-button type="primary" :loading="saving" @click="onSave">保存</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import type { FormInst } from 'naive-ui'
import { useReconTransactionsStore } from '@/vm/reconciliation/recon-transactions'
import type { BankTransactionDTO } from '@/repo/reconciliation/types'

const vm = useReconTransactionsStore()

// v-model:show support
const props = defineProps<{
  show: boolean
  transaction: BankTransactionDTO | null
  departmentHeadOptions: Array<{ label: string; value: number }>
}>()
const emit = defineEmits<{
  (e: 'update:show', v: boolean): void
  (e: 'saved'): void
}>()

const showLocal = computed({
  get: () => props.show,
  set: (v: boolean) => emit('update:show', v),
})

const editFormRef = ref<FormInst | null>(null)
const editForm = reactive({
  id: null as number | null,
  statementId: null as number | null,
  name: '',
  description: '' as string | null,
  note: '' as string | null,
  date: null as number | null, // timestamp for n-date-picker
  amount: 0 as number,
  transactionType: 'INCOME' as 'INCOME' | 'OUTCOME',
  expenseType: null as 'PRODUCTION' | 'MANAGEMENT' | null,
  departmentHeadId: null as number | null,
  // Preserve non-editable values for full update
  tag: null as string | null,
  submissionStatus: 'WAITING' as 'WAITING' | 'NOT_REQUIRED' | 'INVALID_CONTENT' | 'SUBMITTED',
  fileUrl: null as string | null,
  fileName: null as string | null,
  categoryNote: null as string | null,
})

const editRules: Record<string, any> = {
  name: { required: true, message: '请输入名称', trigger: ['input', 'blur'] },
  date: { required: true, type: 'number', message: '请选择日期', trigger: ['change', 'blur'] },
  amount: { required: true, type: 'number', message: '请输入金额', trigger: ['input', 'blur'] },
  transactionType: { required: true, message: '请选择类型', trigger: ['change'] },
}

function fillForm(row: BankTransactionDTO | null) {
  if (!row) return
  editForm.id = row.id
  editForm.statementId = row.statementId
  editForm.name = row.name
  editForm.description = (row.description ?? '') as string | null
  editForm.date = new Date(row.date + 'T00:00:00').getTime()
  editForm.amount = Number(row.amount)
  editForm.transactionType = row.transactionType
  editForm.expenseType = row.transactionType === 'OUTCOME' ? (row.expenseType ?? null) : null
  editForm.departmentHeadId = row.departmentHead?.id ?? null
  // preserve
  editForm.tag = (row.tag ?? null) as string | null
  editForm.submissionStatus = row.submissionStatus
  editForm.fileUrl = (row.fileUrl ?? null) as string | null
  editForm.fileName = (row.fileName ?? null) as string | null
  editForm.categoryNote = (row.categoryNote ?? null) as string | null
  editForm.note = (row.note ?? null) as string | null
}

watch(
  () => props.transaction,
  (row) => {
    if (showLocal.value) fillForm(row)
  },
  { immediate: true }
)

watch(
  () => props.show,
  (v) => {
    if (v) {
      // reset validation and fill
      setTimeout(() => editFormRef.value?.restoreValidation(), 0)
      fillForm(props.transaction)
    }
  }
)

function toLocalDate(ts: number | null): string | null {
  if (!ts || !Number.isFinite(ts)) return null
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const saving = ref(false)
async function onSave() {
  try {
    await editFormRef.value?.validate()
    saving.value = true
    const payload = {
      id: editForm.id ?? null,
      statementId: Number(editForm.statementId),
      name: editForm.name,
      description: (editForm.description ?? null) as string | null,
      date: toLocalDate(editForm.date) as string,
      amount: Number(editForm.amount),
      transactionType: editForm.transactionType,
      expenseType: editForm.transactionType === 'OUTCOME' ? (editForm.expenseType ?? null) : null,
      departmentHeadId: (editForm.departmentHeadId ?? null) as number | null,
      tag: (editForm.tag ?? null) as string | null,
      submissionStatus: editForm.submissionStatus,
      fileUrl: (editForm.fileUrl ?? null) as string | null,
      fileName: (editForm.fileName ?? null) as string | null,
      categoryNote: (editForm.categoryNote ?? null) as string | null,
      note: (editForm.note ?? null) as string | null,
    }
    await vm.saveTransactionEdit(payload as any)
    window.$message?.success?.('保存成功')
    emit('saved')
    emit('update:show', false)
  } catch (e: any) {
    window.$message?.error?.(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function close() {
  emit('update:show', false)
}
</script>
