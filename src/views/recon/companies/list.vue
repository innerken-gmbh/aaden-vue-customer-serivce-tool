<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold">
        公司列表
      </h2>
      <n-button
        type="primary"
        @click="vm.openCreate"
      >
        新建公司
      </n-button>
    </div>

    <n-spin :show="vm.loading">
      <n-empty
        v-if="!vm.loading && vm.list.length === 0"
        description="暂无公司"
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
      title="公司信息"
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
          label="名称"
          path="name"
        >
          <n-input
            v-model:value="vm.form.name"
            maxlength="100"
            show-count
            placeholder="请输入公司名称"
          />
        </n-form-item>
        <n-form-item
          label="备注"
          path="notes"
        >
          <n-input
            v-model:value="vm.form.notes"
            type="textarea"
            placeholder="可选"
          />
        </n-form-item>
        <n-form-item label="部门负责人">
          <div class="w-full space-y-2">
            <div
              v-for="(dh, i) in vm.form.departmentHeads"
              :key="i"
              class="flex items-center gap-2"
            >
              <n-input
                v-model:value="dh.name"
                placeholder="姓名"
                maxlength="100"
              />
              <n-input
                v-model:value="dh.notes"
                placeholder="备注(可选)"
              />
              <n-button
                quaternary
                type="error"
                @click="vm.removeDepartmentHead(i)"
              >
                删除
              </n-button>
            </div>
            <n-button
              tertiary
              @click="vm.addDepartmentHead"
            >
              新增负责人
            </n-button>
          </div>
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
import { useReconCompaniesStore } from '@/vm/reconciliation/recon-companies'
import type { CompanyDTO } from '@/repo/reconciliation/types'

const router = useRouter()
const vm = useReconCompaniesStore()

const columns = [
  { title: '名称', key: 'name' },
  { title: '备注', key: 'notes' },
  { title: '创建时间', key: 'createTimestamp' },
  { title: '负责人数量', key: 'departmentHeads', render: (row: CompanyDTO) => row.departmentHeads?.length ?? 0 },
  {
    title: '操作',
    key: 'actions',
    render(row: CompanyDTO) {
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
            onClick: () => router.push({ name: 'ReconAccounts', params: { companyId: row.id } }),
          },
          '账户管理'
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
