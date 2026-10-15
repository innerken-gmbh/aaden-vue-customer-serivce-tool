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
      <div class="flex flex-col gap-4">
        <div
          v-for="(devices, note) in groupedDevices"
          :key="note"
          class="flex flex-col gap-2"
        >
          <div class="text-xs font-bold text-gray-500 border-b pb-1">
            {{ note }}
          </div>
          <div class="flex flex-wrap gap-2">
            <n-tag
              v-for="device in devices"
              :key="device.deviceId"
              :checked="selectedIds.includes(device.deviceId)"
              round
              checkable
              @update:checked="(checked) => toggleDeviceId(device.deviceId, checked)"
            >
              {{ device.deviceId }}{{ device.note ? ` (${device.note})` : '' }}
            </n-tag>
          </div>
        </div>
        <div
          v-if="allDeviceInfos.length === 0"
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
        <div class="flex flex-col gap-2">
          <div class="flex gap-2">
            <n-input
              v-model:value="newDeviceId"
              placeholder="输入新的设备ID"
              @keyup.enter="addDeviceId"
            />
            <n-input
              v-model:value="newDeviceNote"
              placeholder="输入备注 (可选)"
              @keyup.enter="addDeviceId"
            />
            <n-button
              type="primary"
              @click="addDeviceId"
            >
              添加
            </n-button>
          </div>
          <div
            v-if="noteHistory.length > 0"
            class="flex flex-wrap gap-2 mt-1"
          >
            <div class="text-xs text-gray-400 w-full mb-1">
              常用备注 (点击输入):
            </div>
            <n-tag
              v-for="note in noteHistory"
              :key="note"
              size="small"
              type="info"
              cursor="pointer"
              @click="newDeviceNote = note"
            >
              {{ note }}
            </n-tag>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 min-h-[100px] p-4 border border-gray-200 rounded-md">
          <n-tag
            v-for="device in storedDeviceIds"
            :key="device.deviceId"
            closable
            @close="removeDeviceId(device.deviceId)"
          >
            {{ device.deviceId }}{{ device.note ? ` (${device.note})` : '' }}
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

interface DeviceInfo {
  deviceId: string
  note: string
}

const storedDeviceIds = ref<DeviceInfo[]>([])
const noteHistory = ref<string[]>([])
const showManager = ref(false)
const newDeviceId = ref('')
const newDeviceNote = ref('')

const allDeviceInfos = computed(() => {
  const map = new Map<string, string>()
  storedDeviceIds.value.forEach((d) => map.set(d.deviceId, d.note))

  // Also include any selected IDs that might not be in storedDeviceIds
  selectedIds.value.forEach((id) => {
    if (!map.has(id)) {
      map.set(id, '')
    }
  })

  return Array.from(map.entries()).map(([deviceId, note]) => ({ deviceId, note }))
})

watch(() => props.value, (newVal) => {
  selectedIds.value = [...newVal]
}, { deep: true })

onMounted(() => {
  const allSaved = localStorage.getItem('allStoredDeviceIds')
  if (allSaved) {
    try {
      const parsed = JSON.parse(allSaved)
      if (Array.isArray(parsed)) {
        storedDeviceIds.value = parsed.map((item) => {
          if (typeof item === 'string') {
            return { deviceId: item, note: '' }
          }
          return item
        })
      }
    } catch (e) {
      console.error('Failed to parse storedDeviceIds', e)
    }
  }

  const savedHistory = localStorage.getItem('noteHistory')
  if (savedHistory) {
    try {
      const parsed = JSON.parse(savedHistory)
      if (Array.isArray(parsed)) {
        noteHistory.value = parsed
      }
    } catch (e) {
      console.error('Failed to parse noteHistory', e)
    }
  }
})


function addDeviceId() {
  const id = newDeviceId.value.trim()
  const note = newDeviceNote.value.trim()
  if (!id) return
  if (storedDeviceIds.value.some((d) => d.deviceId === id)) {
    message?.warning('设备ID已存在')
    return
  }
  storedDeviceIds.value.push({ deviceId: id, note })
  saveStoredDeviceIds()

  if (note && !noteHistory.value.includes(note)) {
    noteHistory.value.unshift(note)
    if (noteHistory.value.length > 20) {
      noteHistory.value.pop()
    }
    saveNoteHistory()
  }

  newDeviceId.value = ''
  newDeviceNote.value = ''
}

function removeDeviceId(id: string) {
  storedDeviceIds.value = storedDeviceIds.value.filter((d) => d.deviceId !== id)
  saveStoredDeviceIds()

  // 如果被删除的 ID 在选中列表中，也需要移除
  if (selectedIds.value.includes(id)) {
    handleUpdate(selectedIds.value.filter((i) => i !== id))
  }
}

const groupedDevices = computed(() => {
  const groups: Record<string, DeviceInfo[]> = {}
  allDeviceInfos.value.forEach((device) => {
    const note = device.note || '无备注'
    if (!groups[note]) {
      groups[note] = []
    }
    groups[note].push(device)
  })
  return groups
})

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

function saveNoteHistory() {
  localStorage.setItem('noteHistory', JSON.stringify(noteHistory.value))
}
</script>
