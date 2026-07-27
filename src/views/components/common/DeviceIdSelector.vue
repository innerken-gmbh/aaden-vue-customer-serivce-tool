<template>
  <div class="flex flex-col gap-2 w-full">
    <div class="flex justify-end">
      <n-button
        type="primary"
        @click="showManager = true"
      >
        管理设备
      </n-button>
    </div>
    <n-card
      title="设备选择"
      size="small"
    >
      <div class="flex flex-wrap gap-2">
        <n-tag
          v-for="id in allDeviceIds"
          :key="id"
          :checked="selectedIds.includes(id)"
          round
          checkable
          @update:checked="(checked) => toggleDeviceId(id, checked)"
        >
          {{ id }}
        </n-tag>
        <div
          v-if="allDeviceIds.length === 0"
          class="text-gray-400 text-sm"
        >
          暂无设备，请点击管理按钮添加
        </div>
      </div>
    </n-card>


    <n-modal
      v-model:show="showManager"
      preset="card"
      title="设备ID管理"
      style="width: 600px"
      :bordered="false"
    >
      <div class="flex flex-col gap-4">
        <div class="flex gap-2">
          <n-input
            v-model:value="newDeviceId"
            placeholder="输入新的设备ID"
            @keyup.enter="addDeviceId"
          />
          <n-button
            type="primary"
            @click="addDeviceId"
          >
            添加
          </n-button>
        </div>
        <div class="flex flex-wrap gap-2 min-h-[100px] p-4 border border-gray-200 rounded-md">
          <n-tag
            v-for="id in storedDeviceIds"
            :key="id"
            closable
            @close="removeDeviceId(id)"
          >
            {{ id }}
          </n-tag>
          <div
            v-if="storedDeviceIds.length === 0"
            class="text-gray-400 text-sm flex items-center justify-center w-full"
          >
            暂无设备，请输入并点击添加
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, computed } from 'vue'
import { NButton, NInput, NModal, NCard, NTag, useMessage } from 'naive-ui'

const props = defineProps({
  value: {
    type: Array as () => string[],
    default: () => []
  }
})

const emits = defineEmits(['update:value', 'change'])
const message = useMessage()

const selectedIds = ref<string[]>([...props.value])
const storedDeviceIds = ref<string[]>([])
const showManager = ref(false)
const newDeviceId = ref('')

const allDeviceIds = computed(() => {
  const all = new Set([...storedDeviceIds.value, ...selectedIds.value])
  return Array.from(all)
})

watch(() => props.value, (newVal) => {
  selectedIds.value = [...newVal]
}, { deep: true })

onMounted(() => {
  const allSaved = localStorage.getItem('allStoredDeviceIds')
  if (allSaved) {
    storedDeviceIds.value = JSON.parse(allSaved)
  }
})


function addDeviceId() {
  const id = newDeviceId.value.trim()
  if (!id) return
  if (storedDeviceIds.value.includes(id)) {
    message?.warning('设备ID已存在')
    return
  }
  storedDeviceIds.value.push(id)
  saveStoredDeviceIds()
  newDeviceId.value = ''
}

function removeDeviceId(id: string) {
  storedDeviceIds.value = storedDeviceIds.value.filter(d => d !== id)
  saveStoredDeviceIds()

  // 如果被删除的 ID 在选中列表中，也需要移除
  if (selectedIds.value.includes(id)) {
    handleUpdate(selectedIds.value.filter(i => i !== id))
  }
}

function toggleDeviceId(id: string, checked: boolean) {
  const newSelected = checked
    ? [...selectedIds.value, id]
    : selectedIds.value.filter(i => i !== id)
  handleUpdate(newSelected)
}

function handleUpdate(newVal: string[]) {
  selectedIds.value = newVal
  emits('update:value', newVal)
  emits('change', newVal)
}

function saveStoredDeviceIds() {
  localStorage.setItem('allStoredDeviceIds', JSON.stringify(storedDeviceIds.value))
}
</script>
