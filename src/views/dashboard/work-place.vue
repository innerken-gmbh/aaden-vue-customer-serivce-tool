<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {random,values} from 'lodash-es'
import {fromNowTimestamp, useDeviceEchoLog} from '@/store/aaden/DeviceEcho'
import DashboardLabel from "@/views/jh-widget/dashboard-label.vue";
import {useDialogStore} from "@/store/aaden/dialogStore";
import MiniActionButton from "@/views/BaseWidget/basic/button/MiniActionButton.vue";
import JSpace from "@/views/BaseWidget/basic/JSpace.vue";
import DeviceDetailPage from "@/views/dashboard/DeviceDetailPage.vue";

const deviceEchoLog = useDeviceEchoLog()
const myFood = ref('糖醋里脊')

const rawNgrokUrl = "https://ngrok.aaden.io:4433?hostname=localhost&&username=aaden&&password=SW5uZXJrZW4zMjIu&&port="


function updateMyFood() {
  const foods =
      '糖醋里脊 馄饨 拉面 烩面 热干面 刀削面 油泼面 炸酱面 炒面 重庆小面 米线 酸辣粉 土豆粉 螺狮粉 凉皮儿 麻辣烫 肉夹馍 ' +
      '羊肉汤 炒饭 盖浇饭 卤肉饭 烤肉饭 黄焖鸡米饭 驴肉火烧 川菜 麻辣香锅 火锅 酸菜鱼 烤串 披萨 烤鸭 ' +
      '汉堡 炸鸡 寿司 蟹黄包 煎饼果子 生煎 炒年糕'
  const foodArr = foods.split(' ')
  myFood.value = foodArr.at(random(0, foodArr.length - 1)) ?? '糖醋里脊'
}

onMounted(async () => {
  const clear = setInterval(() => {
    if (autoRefresh.value) {
      deviceEchoLog.updateDeviceLog()
    }

    updateMyFood()
  }, 10 * 1000)
  onBeforeUnmount(() => {
    clearInterval(clear)
  })
  updateMyFood()
  await deviceEchoLog.updateDeviceLog()

})

function getSchema() {
  return {
    title: '修改设备信息',
    subtitle: '可要好好修改，不要改错了',
    schemas: [
      {
        key: 'deviceGroup',
        name: '备注',
        required: false,
        default: "",
        hint: '设备的备注'
      },
      {
        key: 'maxVersion',
        name: 'maxVersion',
        hint: '-1 为不限制任何更新，请注意，如果更新时一次性跳过了多个版本，那么不能保证该机器一定会停止在某个版本',
        default: "-1",
      },
    ]
  }
}

const dialogStore = useDialogStore()

async function updateInfo(item) {
  const info = await dialogStore.editItem(getSchema(), item)
  console.log(info)
  info.deviceGroup = info.deviceGroup ?? ""
  await dialogStore.waitFor(async () => {
        await deviceEchoLog.updateDeviceLogInfo(info.deviceId, info.deviceGroup, info.maxVersion)
      }
  )
}

function clickItem(e, row) {
  deviceEchoLog.selectDevice(row.item)
}



function getRowProp(data) {
  const props = {
    key: data.item.deviceId
  }
  if (deviceEchoLog.cliVersionOk(data.item) && deviceEchoLog.backgroundVersionOk(data.item) && deviceEchoLog.diskOk(data.item)) {
    props.class = "bg-green-lighten-5"
  }
  return props
}

const headers = ref([
  {title: '操作', key: 'action', align: 'start'},
  {
    title: 'DeviceId/Note',
    key: 'deviceId',
  },
  {
    title: '门店名称',
    key: 'deviceName',
  },
  {title: 'cliVersion', key: 'cliVersion', align: 'end'},
  {title: 'backendVersion', key: 'backendVersion', align: 'end'},
  {title: '磁盘情况', key: 'diskUsage', align: 'end'},
  {title: '报告时间', key: 'timestamp', align: 'end'},
])

function formatRestaurantInfo(restaurantInfoString) {
  return (restaurantInfoString?.name ?? '').substring(0, 24)
}

const autoRefresh = ref(true)



function showNgrokForDevice(device) {
  window.open(rawNgrokUrl + '1' + device.deviceId.toString().padStart(4, '0'))
}

function displayAddress(address) {
  // 将字符串按换行符分割
  const parts = address?.split('\n');
  if (parts)

      // 将每一部分用HTML标签包裹起来
    return `<div class="pa-2 font-weight-black">
                    ${parts[0]}
                </div>`;
  else return ""
}
</script>

<template>
  <div class="main-container">
    <v-card class="mt-4">
      <div
        class="text-body-2 d-flex"
      >
        <dashboard-label color="purple-lighten-4">
          <template #label>
            🌃😋今天可以吃
          </template>
          {{ myFood }}
        </dashboard-label>
        <dashboard-label :color="autoRefresh?'green-lighten-4':'grey-lighten-4'">
          <template #label>
            上次刷新时间
          </template>
          <div @click="autoRefresh=!autoRefresh">
            {{ deviceEchoLog.lastUpdateTimestamp }}
            <template v-if="autoRefresh">
              ✔
            </template>
          </div>
        </dashboard-label>
        <dashboard-label color="blue-lighten-4">
          <template #label>
            结果总数
          </template>
          {{ deviceEchoLog.activeDeviceLogs.length }}(
          {{ deviceEchoLog.activeDeviceLogs.filter(it => it.deviceOnline).length }})
        </dashboard-label>
        <dashboard-label color="grey-lighten-4">
          <template #label>
            最新版本后端
          </template>
          {{ deviceEchoLog.currentBackendVersion }}
          ({{
            deviceEchoLog.activeDeviceLogs.filter(deviceEchoLog.backgroundVersionOk).length
          }})
        </dashboard-label>
        <dashboard-label color="grey-lighten-3">
          <template #label>
            Cli版本
          </template>
          {{ deviceEchoLog.cliVersion }}
          ({{
            deviceEchoLog.activeDeviceLogs.filter(deviceEchoLog.cliVersionOk).length
          }})
        </dashboard-label>
        <dashboard-label color="yellow-lighten-4">
          <template #label>
            磁盘警告
          </template>
          {{
            deviceEchoLog.activeDeviceLogs.filter(it => !deviceEchoLog.diskOk(it)).length
          }}
        </dashboard-label>
        <dashboard-label
          :loading="deviceEchoLog.ngrokLoading"
          color="blue-lighten-4"
          @click="deviceEchoLog.checkNgrok"
        >
          <template #label>
            Ngrok状态
          </template>
          {{
            deviceEchoLog.activeDeviceLogs.filter(it => it.ngrokOnline).length
          }}
        </dashboard-label>
        <v-text-field
          v-model="deviceEchoLog.search"
          hide-details
          prepend-inner-icon="mdi-magnify"
        />
      </div>

      <v-data-table
        :row-props="getRowProp"
        :items-per-page="-1"
        :items="deviceEchoLog.activeDeviceLogs"
        :headers="headers"
        @click:row="clickItem"
      >
        <template #[`item.deviceId`]="{ item }">
          {{ item.deviceId }}
          <template v-if="item.deviceGroup">
            / {{ item.deviceGroup }}
          </template>
        </template>
        <template #[`item.timestamp`]="{ item }">
          {{ fromNowTimestamp(item.timestamp) }}
        </template>
        <template #[`item.deviceName`]="{ item }">
          <div v-html="displayAddress(item.deviceName)" />
        </template>
        <template #[`item.restaurantInfo`]="{ item }">
          <span
            class="text-body-2 font-weight-black"
            style="max-width: 200px; white-space: break-spaces"
          >
            {{ formatRestaurantInfo(item.restaurantInfo) }}
          </span>
        </template>
        <template #[`item.cliVersion`]="{ item }">
          <div
            class="d-flex justify-end"
            style="width: 100%;"
          >
            <v-sheet
              class="pa-1"
              style="width: fit-content"
              :color="deviceEchoLog.cliVersionOk(item)&&item.ngrokOk?'green-darken-4':'red-darken-4'"
            >
              {{ item.cliVersion }}
              <span v-if="!item.ngrokOk">
                ⚠
              </span>
            </v-sheet>
          </div>
        </template>
        <template #[`item.backendVersion`]="{ item }">
          <div
            class="d-flex justify-end"
            style="width: 100%;"
          >
            <v-sheet
              class="pa-1"
              style="width: fit-content"
              :color="deviceEchoLog.backgroundVersionOk(item)?'green':'red'"
            >
              {{ item.backendVersion }}
              <template v-if="item.maxVersion!=='-1'">
                / {{ item.maxVersion }}
              </template>
            </v-sheet>
          </div>
        </template>
        <template #[`item.diskUsage`]="{ item }">
          <div
            class="d-flex justify-end"
            style="width: 100%;"
          >
            <v-sheet
              :class="deviceEchoLog.diskOk(item)?'':'pa-1'"
              style="width: fit-content"
              :color="deviceEchoLog.diskOk(item)?'transparent':'red'"
            >
              {{ item.diskUsage }}
            </v-sheet>
          </div>
        </template>
        <template #[`item.action`]="{ item }">
          <j-space>
            <mini-action-button
              :color="item.ngrokOnline?'green-darken-4':'grey-lighten-4'"
              text="Ngrok"
              @click="showNgrokForDevice(item)"
            />
            <mini-action-button
              text="修改信息"
              @click="updateInfo(item)"
            />
          </j-space>
        </template>
      </v-data-table>
    </v-card>
    <device-detail-page @ngrok="showNgrokForDevice(deviceEchoLog.activeDevice)" />
  </div>
</template>
