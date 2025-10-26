<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">
        账户管理
      </h2>
      <n-button
        type="primary"
        @click="vm.openCreate"
      >
        新增账户
      </n-button>
    </div>

    <n-spin :show="vm.loading">
      <n-empty
        v-if="!vm.loading && vm.list.length === 0"
        description="暂无账户"
      />
      <n-data-table
        v-else
        :columns="columns"
        :data="vm.list"
        :bordered="false"
      />
    </n-spin>

    <n-modal
      v-model:show="vm.showModal"
      preset="card"
      title="账户信息"
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
          label="银行名称"
          path="bankName"
        >
          <n-input
            v-model:value="vm.form.bankName"
            maxlength="100"
            show-count
            placeholder="请输入银行名称"
          />
        </n-form-item>
        <n-form-item
          label="账号"
          path="accountNumber"
        >
          <n-input
            v-model:value="vm.form.accountNumber"
            maxlength="34"
            show-count
            placeholder="请输入账号"
          />
        </n-form-item>
        <n-form-item
          label="别名"
          path="alias"
        >
          <n-input
            v-model:value="vm.form.alias"
            maxlength="100"
            show-count
            placeholder="可选"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="vm.showModal = false">
            取消
          </n-button>
          <n-button
            type="primary"
            @click="onSubmit"
          >
            保存
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReconAccountsStore } from '@/vm/reconciliation/recon-accounts'
import type { ReconciliationAccountDTO } from '@/repo/reconciliation/types'

const router = useRouter()
const vm = useReconAccountsStore()

const columns = [
  { title: '银行名称', key: 'bankName' },
  { title: '账号', key: 'accountNumber', render: (row: ReconciliationAccountDTO) => vm.masked(row.accountNumber) },
  { title: '别名', key: 'alias' },
  { title: '创建时间', key: 'createTimestamp' },
  {
    title: '操作',
    key: 'actions',
    render(row: ReconciliationAccountDTO) {
      return [
        h(
          'a',
          { class: 'text-primary mr-3 cursor-pointer', onClick: () => vm.openEdit(row) },
          '编辑'
        ),
        h(
          'a',
          {
            class: 'text-primary cursor-pointer',
            onClick: () => router.push({ name: 'ReconTransactions', params: { companyId: row.companyId } }),
          },
          '流水'
        ),
      ]
    },
  },
]

function onSubmit() {
  vm.submit().catch((e) => window.$message?.error?.(e?.message || '保存失败'))
}

onMounted(vm.load)
</script>
