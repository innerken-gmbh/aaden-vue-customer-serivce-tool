<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">
        对账单
      </h2>
      <n-button
        type="primary"
        @click="vm.openUpload"
      >
        上传对账单
      </n-button>
    </div>

    <n-alert
      type="info"
      closable
    >
      上传后将自动触发解析；若日期范围与现有对账单重叠，将覆盖重叠范围内的旧数据。
    </n-alert>

    <n-spin :show="vm.loading">
      <n-empty
        v-if="!vm.loading && vm.list.length === 0"
        description="暂无数据"
      />
      <n-data-table
        v-else
        :columns="columns"
        :data="vm.list"
        :bordered="false"
      />
    </n-spin>

    <n-modal
      v-model:show="vm.showUpload"
      preset="card"
      title="上传对账单"
      :mask-closable="false"
      style="width: 680px; max-width: 90vw"
      content-style="max-height: 70vh; overflow: auto"
    >
      <n-form
        :model="vm.form"
        :rules="vm.rules"
        label-width="96"
      >
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
        <n-form-item
          label="文件"
          path="file"
        >
          <input
            type="file"
            accept="application/pdf"
            @change="onPickFile"
          >
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="vm.showUpload = false">
            取消
          </n-button>
          <n-button
            type="primary"
            @click="onSubmit"
          >
            开始上传
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReconStatementsStore } from '@/vm/reconciliation/recon-statements'
import type { BankStatementDTO } from '@/repo/reconciliation/types'

const router = useRouter()
const vm = useReconStatementsStore()

function onPickFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    vm.form.file = input.files[0]
  }
}

const columns = [
  { title: '名称', key: 'name' },
  { title: '描述', key: 'description' },
  { title: '日期', key: 'dateRange', render: (row: BankStatementDTO) => `${row.startDate} ~ ${row.endDate}` },
  { title: '已解析', key: 'parsed', render: (row: BankStatementDTO) => (row.parsed ? '是' : '否') },
  { title: '文件', key: 'fileUrl', render: (row: BankStatementDTO) => h('a', { href: row.fileUrl, target: '_blank' }, row.fileUrl ? '下载' : '-') },
  { title: '创建时间', key: 'createTimestamp' },
  {
    title: '操作',
    key: 'actions',
    render(row: BankStatementDTO) {
      return h(
        'a',
        { class: 'text-primary cursor-pointer', onClick: () => router.push({ name: 'ReconTransactions', params: { statementId: row.id } }) },
        '查看流水'
      )
    },
  },
]

function onSubmit() {
  vm.submitUpload().catch((e) => window.$message?.error?.(e?.message || '上传失败'))
}

onMounted(vm.load)
</script>
