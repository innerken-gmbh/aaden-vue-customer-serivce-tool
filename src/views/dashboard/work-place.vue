<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'
import {random} from 'lodash-es'
import {fromNowTimeDisplay, fromNowTimestamp, useDeviceEchoLog} from '@/store/aaden/DeviceEcho'
import DashboardLabel from "@/views/jh-widget/dashboard-label.vue";
import {useDialogStore} from "@/store/aaden/dialogStore";
import MiniActionButton from "@/views/BaseWidget/basic/button/MiniActionButton.vue";
import JSpace from "@/views/BaseWidget/basic/JSpace.vue";
import DeviceDetailPage from "@/views/dashboard/DeviceDetailPage.vue";
import {getNgrokUrl} from "@/old/utils/firebase";
import {recordSchema} from "@/old/utils/recordSchema";
import dayjs from "dayjs";
import {allProductCodeList, softProductCodeList, useSubscriptionStore} from "@/store/aaden/saasSubscription";
import {addProduct, deleteProduct} from "@/store/aaden/cloud-v2-api";
import LoadingProvider from "@/views/BaseWidget/basic/premade/LoadingProvider.vue";

const deviceEchoLog = useDeviceEchoLog()
const myFood = ref('糖醋里脊')
const totalStatusList = ref([{name:'尚未上云',value:'尚未上云'},{name:'脚本未部署',value:'script not found'},{name:'服务器错误',value:'server error'},{name:'未知错误',value:'unexpected error'},{name:'不使用TSE',value:'not using TSE'},{name:'没有模板',value:'template is null'},{name:'无需替换',value:'already done'},{name:'模板上没有TSE片段',value:'no TSE fragment'},{name:'可以自动替换模板',value:'ready to replace'},{name:'模板替换完成',value:'replace done'}])

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

function showZHName (text) {
  return totalStatusList.value.find(it => it.value === text).name
}

function showCurrentColor(text) {
  if (text === 'not using TSE' || text === 'script not found') {
    return 'yellow'
  } else if (text === 'already done' || text === 'replace done' || text === 'ready to replace') {
    return 'green'
  } else {
    return 'red'
  }
}

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
const store = useDeviceEchoLog()
const downloadSchema = ref({
  title: '下载3合1',
  subtitle: '提示：下载时可能会使目标卡顿，建议在老板不忙时下载',
  schemas: [
    {
      key: 'deviceId',
      name: '设备Id',
    },
    {
      key: 'year',
      name: '年份',
      default: dayjs().format('YYYY'),
    },
    {
      key: 'month',
      name: '月份',
      default: dayjs().format('MM'),
    },
  ]
})
const activeProductDialog = ref(false)
const storeSub = useSubscriptionStore()

const currentProducts = computed(() => {
  const activeProductCode = storeSub.productList.map(it => it.productCode)
  return softProductCodeList.map(it => {
    if (activeProductCode.includes(it.value)) {
      it.active = true
    } else {
      it.active = false
    }
    return it
  })
})
async function editProduct (item) {
  storeSub.loading = true
  if (item.active) {
    const id = storeSub.productList.find(it => it.productCode === item.value).id
    await deleteProduct(id)
  } else {
    await addProduct(item.value,storeSub.deviceId)
  }
  storeSub.loading = false
  activeProductDialog.value = false
}
async function showActiveProduct (item) {
  await storeSub.getProductList()
  storeSub.deviceId = item.deviceId
  activeProductDialog.value = true
}
async function download3In1() {
  const info = await dialogStore.editItem(downloadSchema.value, null)
  const url = 'https://ik' + info.deviceId.padStart(4,'0') + '.ngrok.aaden.io/PHP/BackendData.php?op=download3In1ForMonth&year=' + info.year + '&month=' + info.month
  await dialogStore.waitFor(async () => {
    window.open(url)
      })
}

async function updateInfo(item) {
  const info = await dialogStore.editItem(getSchema(), item)
  console.log(info)
  info.deviceGroup = info.deviceGroup ?? ""
  await dialogStore.waitFor(async () => {
        await deviceEchoLog.updateDeviceLogInfo(info.deviceId, info.deviceGroup, info.maxVersion)
      }
  )
}

async function createNewNote (item) {
  const info = await dialogStore.editItem(recordSchema)
  info.deviceId = item.deviceId
  await dialogStore.waitFor(async () => {
    await store.addEventLog(info)
  })
}

function clickItem(e, row) {
  deviceEchoLog.selectDevice(row.item)
}

const iframeUrl = ref("")
const showIframe = ref(false)

function showIframePageForUrl(url) {
  iframeUrl.value = url
  showIframe.value = true
}

function showFrontendForDeviceId(item) {
  const ngrokUrl = getNgrokUrl(item.deviceId)
  const url = "https://aaden-app.vercel.app/?Base=" + ngrokUrl
  showIframePageForUrl(url)
}

function showAdminForDeviceId(item) {
  const ngrokUrl = getNgrokUrl(item.deviceId)
  const url = "https://admin.aaden.io/?Base=" + ngrokUrl + '&Admin=1'
  showIframePageForUrl(url)
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
  {title: '操作', key: 'action', align: 'start', width: 100},
  {
    title: 'DeviceId',
    key: 'deviceId',
  },
  {
    title: '最新动态',
    key: 'deviceGroup',
  },
  {
    title: '门店名称',
    key: 'deviceName',
  },
  {
    title: 'summaryStatus',
    key: 'summaryStatus',
  },
  {title: '上次备份', key: 'lastBackupTime'},
  {title: 'Cli | Backend', key: 'version', align: 'end'},
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
        <v-select
          v-model="deviceEchoLog.summaryStatus"
          label="SummaryStatus"
          clearable
          hide-details
          item-title="name"
          item-value="value"
          :items="totalStatusList"
        />
        <v-text-field
          v-model="deviceEchoLog.search"
          clearable
          hide-details
          prepend-inner-icon="mdi-magnify"
        />
        <dashboard-label
          color="orange-lighten-4"
          @click="download3In1"
        >
          <template #label>
            数据下载
          </template>
          三合一
        </dashboard-label>
      </div>

      <v-data-table
        :row-props="getRowProp"
        :items-per-page="50"
        :items="deviceEchoLog.activeDeviceLogs"
        :headers="headers"
        @click:row="clickItem"
      >
        <template #[`item.timestamp`]="{ item }">
          {{ fromNowTimestamp(item.timestamp) }}
        </template>
        <template #[`item.lastBackupTime`]="{ item }">
          <v-tooltip bottom>
            <template #activator="{props }">
              <div v-bind="props">
                {{ fromNowTimestamp(item.lastBackupTime) }}
              </div>
            </template>
            <span>{{ fromNowTimeDisplay(item.lastBackupTime) }}</span>
          </v-tooltip>
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
        <template #[`item.summaryStatus`]="{ item }">
          <v-card
            elevation="0"
            :color="showCurrentColor(item.summaryStatus)"
            class="pa-2 d-flex justify-center align-center"
          >
            {{ showZHName(item.summaryStatus) }}
          </v-card>
        </template>
        <template #[`item.version`]="{ item }">
          <div
            class="d-flex justify-end"
            style="width: 100%;"
          >
            <div>
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
            <div>
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
              :color="item.ngrokOnline?'green-darken-4':(item.deviceOnline?'pink-darken-4':'grey-lighten-4')"
              text="Ngrok"
              @click="showNgrokForDevice(item)"
            />
            <mini-action-button
              :color="item.ngrokOnline?'blue':'grey-lighten-4'"
              text="中台"
              @click="showAdminForDeviceId(item)"
            />
            <mini-action-button
              :color="item.ngrokOnline?'indigo':'grey-lighten-4'"
              text="前端"
              @click="showFrontendForDeviceId(item)"
            />
            <mini-action-button
              text="备注"
              @click="createNewNote(item)"
            />
            <mini-action-button
              text="产品"
              @click="showActiveProduct(item)"
            />
          </j-space>
        </template>
      </v-data-table>
    </v-card>
    <device-detail-page @ngrok="showNgrokForDevice(deviceEchoLog.activeDevice)" />
    <v-dialog
      v-model="showIframe"
      max-width="1600"
    >
      <v-card color="black">
        <div class="pa-2 d-flex">
          正在显示： {{ iframeUrl }}
          <v-spacer />
          <a
            target="_blank"
            rel="noopener noreferrer"
            class="underline d-flex align-center text-blue"
            :href="iframeUrl"
          >打开
            <v-icon
              size="16"
              class="ml-2 mb-1"
            >mdi-open-in-new
            </v-icon>
          </a>
        </div>
        <iframe
          v-if="showIframe"
          height="900"
          width="1600"
          :src="iframeUrl"
        />
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="activeProductDialog"
      max-width="600px"
    >
      <v-card
        rounded="lg"
        class="pa-4"
      >
        <div class="d-flex align-center justify-center">
          <div class="text-body-1" />
          <v-spacer />
          <div>
            <v-btn
              elevation="0"
              icon
              @click="activeProductDialog = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
        <loading-provider :loading="storeSub.loading">
          <div
            class="mt-2"
            style="display: grid;grid-gap: 16px;grid-template-columns: repeat(4, 1fr)"
          >
            <v-chip
              v-for="(item,index) in currentProducts"
              :key="index"
              :color="item.active ? 'info' : ''"
              class="d-flex align-center justify-center"
              style="width: 100%;white-space: normal;height: 50px"
              @click="editProduct(item)"
            >
              {{ item.name }}
            </v-chip>
          </div>
        </loading-provider>
      </v-card>
    </v-dialog>
  </div>
</template>
