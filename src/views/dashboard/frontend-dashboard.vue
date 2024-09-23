<script setup>
import {onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {fromNowTimestamp, useDeviceEchoLog} from '@/store/aaden/DeviceEcho'
import DashboardLabel from "@/views/jh-widget/dashboard-label.vue";
import DeviceDetailPage from "@/views/dashboard/DeviceDetailPage.vue";
import {useFrontendStore} from "@/store/aaden/frontendStore";
import JSpace from "@/views/BaseWidget/basic/JSpace.vue";

const store = useFrontendStore()
const deviceEchoLog = useDeviceEchoLog()


onMounted(() => {
  store.reload()

  const clear = setInterval(() => {
    if (autoRefresh.value) {
      store.reload()
    }
  }, 10 * 1000)
  onBeforeUnmount(() => {
    clearInterval(clear)
  })
})

const rawNgrokUrl = "https://ngrok.aaden.io:4433?hostname=localhost&&username=aaden&&password=SW5uZXJrZW4zMjIu&&port="

function showNgrokForDevice(device) {
  window.open(rawNgrokUrl + '1' + device.deviceId.toString().padStart(4, '0'))
}

const headers = ref([
  {
    title: 'ID',
    key: 'id',
  },
  {
    title: 'DeviceId/Note',
    key: 'deviceId',
  },
  {title: '前端类型', key: 'frontendType'},
  {title: '版本', key: 'version',},
  {
    title: '门店名称',
    key: 'name',
  },
  {title: '身份', key: 'uuid', align: 'end'},
  {title: '报告时间', key: 'timestamp', align: 'end'},
])


const autoRefresh = ref(true)


async function clickItem(e, row) {
    await deviceEchoLog.selectLogByDeviceId(row.item.deviceId)
}

</script>

<template>
  <div class="main-container">
    <v-card class="mt-4">
      <div
        class="text-body-2 d-flex"
      >
        <dashboard-label color="blue-lighten-4">
          <template #label>
            结果总数
          </template>
          {{ store.displayList.length }}
        </dashboard-label>
        <v-select
          v-model="store.selectedFrontendTypes"
          label="前端类型"
          clearable
          multiple
          hide-details
          :items="store.frontendTypes"
        />
        <v-text-field
          v-model="store.search"
          clearable
          class="mx-2"
          hide-details
          label="DeviceId"
          prepend-inner-icon="mdi-magnify"
        />
      </div>

      <v-data-table
        :headers="headers"
        :items-per-page="-1"
        :items="store.displayList"
        @click:row="clickItem"
      >
        <template #[`item.timestamp`]="{ item }">
          {{ fromNowTimestamp(item.timestamp) }}
        </template>
      </v-data-table>
    </v-card>
    <device-detail-page @ngrok="showNgrokForDevice(store.activeDevice)" />
  </div>
</template>
