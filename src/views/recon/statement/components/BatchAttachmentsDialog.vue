<template>
  <!-- 批量上传（两步：分析 → 应用） 抽离为独立组件 -->
  <n-modal
    v-model:show="innerShow"
    preset="card"
    title="批量上传附件（AI 分析预览）"
    :mask-closable="false"
    style="width: 960px; max-width: 95vw"
    content-style="max-height: 75vh; overflow: auto"
  >
    <div class="space-y-3">
      <div
        v-if="!vm.batchPreview.length"
        class="grid grid-cols-1 gap-3"
      >
        <n-select
          v-model:value="vm.batchStatementId"
          :options="vm.statementSelectOptions"
          placeholder="请选择对账单（用于批量匹配附件）"
        />
        <div class="w-full">
          <n-upload
            v-model:file-list="batchUploadList"
            class="compact-upload w-full"
            directory-dnd
            multiple
            :default-upload="false"
            :show-file-list="true"
            accept="application/pdf,image/*"
            @update:file-list="onBatchFileListUpdate"
          >
            <n-upload-dragger>
              <div class="flex flex-col items-center justify-center py-6 text-center text-gray-600">
                <div class="text-base font-medium">
                  拖拽文件到此处，或点击选择
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  支持 PDF 与图片，支持多选
                </div>
                <div
                  v-if="batchFiles.length"
                  class="text-xs text-gray-500 mt-2"
                >
                  已选择 {{ batchFiles.length }} 个文件
                </div>
              </div>
            </n-upload-dragger>
          </n-upload>
        </div>
      </div>

      <!-- 分析结果预览表 -->
      <div
        v-if="vm.batchPreview.length"
        class="space-y-2"
      >
        <div class="flex flex-wrap gap-3 text-sm">
          <n-tag type="info">
            总数：{{ vm.batchPreview.length }}
          </n-tag>
          <n-tag type="warning">
            未匹配：{{ vm.batchPreview.filter(i => !i.matchedTransactionId).length }}
          </n-tag>
          <n-tag type="error">
            无效票据：{{ vm.batchPreview.filter(i => i.validBill === false).length }}
          </n-tag>
        </div>
        <div class="overflow-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left border-b">
                <th class="p-2">
                  文件
                </th>
                <th class="p-2">
                  标题/摘要
                </th>
                <th class="p-2">
                  金额
                </th>
                <th class="p-2">
                  日期
                </th>
                <th class="p-2">
                  有效性
                </th>
                <th class="p-2">
                  匹配流水
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(it, idx) in vm.batchPreview"
                :key="it.fileUrl + idx"
                :class="[
                  'border-b',
                  (!it.matchedTransactionId ? 'bg-amber-50' : ''),
                  (it.validBill === false ? 'bg-red-50' : '')
                ]"
              >
                <td class="p-2 align-top">
                  <a
                    :href="it.fileUrl"
                    target="_blank"
                    class="text-primary hover:underline break-all"
                  >预览</a>
                </td>
                <td class="p-2 align-top">
                  <div class="font-medium">
                    {{ it.title || '（无标题）' }}
                  </div>
                  <div
                    v-if="it.categoryNote"
                    class="text-xs text-blue-600 mt-1"
                  >
                    分类备注：{{ it.categoryNote }}
                  </div>
                </td>
                <td class="p-2 align-top">
                  {{ it.amount ?? '-' }}
                </td>
                <td class="p-2 align-top">
                  {{ it.date ?? '-' }}
                </td>
                <td class="p-2 align-top">
                  <n-tag :type="it.validBill ? 'success' : 'error'">
                    {{ it.validBill ? '有效' : '无效' }}
                  </n-tag>
                </td>
                <td
                  class="p-2 align-top"
                  style="min-width: 280px;"
                >
                  <n-select
                    v-model:value="(it as any).matchedTransactionId"
                    :options="vm.batchTransactionSelectOptions"
                    filterable
                    clearable
                    placeholder="选择匹配的流水"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="text-xs text-gray-500">
          提示：标黄为未匹配，标红为无效票据。你可以手动为文件选择正确的流水，再点“应用更改”。
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-between items-center gap-3 w-full">
        <div class="text-xs text-gray-500">
          第一步：选择对账单并挑选文件 → 点击“开始分析”。 第二步：在下表确认或调整 → 点击“应用更改”。
        </div>
        <div class="flex justify-end gap-2">
          <n-button @click="close">
            关闭
          </n-button>
          <n-button
            v-if="!vm.batchPreview.length"
            type="primary"
            :disabled="batchFiles.length === 0"
            :loading="vm.uploading"
            @click="doBatchUpload"
          >
            开始分析
          </n-button>
          <n-button
            v-else
            secondary
            :disabled="vm.uploading || batchFiles.length === 0"
            @click="doBatchUpload"
          >
            重新分析
          </n-button>
          <n-button
            v-if="vm.batchPreview.length"
            type="primary"
            :loading="vm.applying"
            @click="doApplyAttachments"
          >
            应用更改
          </n-button>
        </div>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UploadFileInfo } from 'naive-ui'
import { useReconTransactionsStore } from '@/vm/reconciliation/recon-transactions'

// Props & emits for v-model:show
const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'update:show', v: boolean): void; (e: 'applied'): void }>()

const innerShow = ref<boolean>(props.show)
watch(
  () => props.show,
  v => (innerShow.value = v)
)
watch(innerShow, (v) => {
  emit('update:show', v)
  if (!v) resetLocal()
})

const vm = useReconTransactionsStore()

// Local state for files (mapped from Naive Upload list)
const batchFiles = ref<File[]>([])
const batchUploadList = ref<UploadFileInfo[]>([])
function onBatchFileListUpdate(list: UploadFileInfo[]) {
  batchUploadList.value = list
  const files: File[] = []
  for (const item of list) {
    if (item.file) files.push(item.file as File)
  }
  batchFiles.value = files
}

async function doBatchUpload() {
  try {
    await vm.batchUpload(batchFiles.value)
  } catch (e: any) {
    window.$message?.error?.(e?.message || '分析失败')
  }
}

async function doApplyAttachments() {
  try {
    await vm.applyBatchAttachments()
    // close after success and notify parent
    innerShow.value = false
    emit('applied')
  } catch (e: any) {
    window.$message?.error?.(e?.message || '应用更改失败')
  }
}

function resetLocal() {
  batchFiles.value = []
  batchUploadList.value = []
  vm.batchPreview = []
  vm.batchStatementId = null
}

function close() {
  innerShow.value = false
}
</script>

<style scoped>
/* Batch dialog — compact upload list styling (Option B) */
/* Make the Naive Upload list scrollable & denser while keeping the built-in list */
.compact-upload .n-upload-dragger {
  min-height: 140px; /* comfortable hit area */
}
.compact-upload .n-upload-file-list {
  max-height: 200px; /* cap height per request (160–200px) */
  overflow: auto;
  margin-top: 8px;
  border: 1px dashed #e5e7eb; /* neutral border */
  border-radius: 6px;
  padding: 4px;
}
/* Denser list items */
.compact-upload .n-upload-file {
  padding: 4px 8px;
  font-size: 12px;
}
/* Tighter meta row (status, actions) */
.compact-upload .n-upload-file .n-upload-file-info,
.compact-upload .n-upload-file .n-upload-file__action,
.compact-upload .n-upload-file .n-upload-file__status {
  line-height: 18px;
}
/* Truncate super long filenames to avoid wrapping */
.compact-upload .n-upload-file .n-upload-file-name,
.compact-upload .n-upload-file .n-upload-file-info__name,
.compact-upload .n-upload-file .n-upload-file-info .n-upload-file-name {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Smaller remove/replace buttons within the list */
.compact-upload .n-upload-file .n-button {
  --n-height: 22px;
  font-size: 12px;
}
</style>
