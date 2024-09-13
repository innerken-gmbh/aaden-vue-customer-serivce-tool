<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {fromNowTimestamp} from '@/store/aaden/DeviceEcho'
import DashboardLabel from "@/views/jh-widget/dashboard-label.vue";
import DeviceDetailPage from "@/views/dashboard/DeviceDetailPage.vue";
import {useFrontendStore} from "@/store/aaden/frontendStore";
import JSpace from "@/views/BaseWidget/basic/JSpace.vue";

const store = useFrontendStore()


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


const headers = ref([
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
          {{ store.list.length }}
        </dashboard-label>
        <j-space>
          <v-card
            v-for="type in store.frontendTypes"
            :key="type"
            class="px-4"
            color="grey-lighten-3"
            flat
          >
            <v-checkbox
              v-model="store.selectedFrontendTypes"
              :value="type"
              hide-details
              :label="type"
            />
          </v-card>
        </j-space>
      </div>

      <v-data-table
        :headers="headers"
        :items-per-page="-1"
        :items="store.displayList"
      >
        <template #[`item.timestamp`]="{ item }">
          {{ fromNowTimestamp(item.timestamp) }}
        </template>
      </v-data-table>
    </v-card>
    <device-detail-page @ngrok="showNgrokForDevice(store.activeDevice)" />
  </div>
</template>
