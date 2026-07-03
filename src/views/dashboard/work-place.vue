<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {random} from 'lodash-es'
import {fromNowTimeDisplay, fromNowTimestamp, useDeviceEchoLog} from '@/store/aaden/DeviceEcho'
import DashboardLabel from "@/views/jh-widget/dashboard-label.vue";
import {useDialogStore} from "@/store/aaden/dialogStore";
import MiniActionButton from "@/views/BaseWidget/basic/button/MiniActionButton.vue";
import JSpace from "@/views/BaseWidget/basic/JSpace.vue";
import DeviceDetailPage from "@/views/dashboard/DeviceDetailPage.vue";
import {createEvent, editTseStatus, getNgrokUrl} from "@/old/utils/firebase";
import {recordSchema} from "@/old/utils/recordSchema";
import dayjs from "dayjs";
import {allProductCodeList, softProductCodeList, useSubscriptionStore} from "@/store/aaden/saasSubscription";
import {addProduct, deleteProduct, maintenanceSchedule} from "@/store/aaden/cloud-v2-api";
import LoadingProvider from "@/views/BaseWidget/basic/premade/LoadingProvider.vue";
import DatePicker from "@/views/BaseWidget/basic/dialog/DatePicker.vue";
import {useDatePickerStore} from "@/views/BaseWidget/basic/dialog/dateRepo";
import {
  checkOutOrder,
  getDetailOrderInfo,
  getPaymentMethod,
  getUnpaidOrder,
  loadPaymentLog
} from "@/store/aaden/payment";
import {createAppInvite, createInvite, getShopBlId, getShopInfo, inviteSchema} from "@/store/aaden/businessLayer";
import {VSelect} from "vuetify/components";

const deviceEchoLog = useDeviceEchoLog()
const myFood = ref('糖醋里脊')
const totalStatusList = ref([{name:'尚未上云',value:'尚未上云'},{name:'脚本未部署',value:'script not found'},{name:'服务器错误',value:'server error'},{name:'未知错误',value:'unexpected error'},{name:'不使用TSE',value:'not using TSE'},{name:'没有模板',value:'template is null'},{name:'无需替换',value:'already done'},{name:'模板上没有TSE片段',value:'no TSE fragment'},{name:'可以自动替换模板',value:'ready to replace'},{name:'模板替换完成',value:'replace done'}])
const totalTseStatusList = ref([{name:'未知的',value: 'Unknown'},{name:'启用的',value: 'Enabled'},{name:'停用的',value: 'Disabled'},{name:'忽略的',value: 'Ignored'}])
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

async function editTse (item) {
  selectedDevice.value = item
  const info = await dialogStore.editItem(tseOperatorSchema.value)
  info.deviceId = item.deviceId
  await dialogStore.waitFor(async () => {
    await editTseStatus(info)
    await createEvent(info)
  })
}

function showZHName (text) {
  return totalStatusList.value.find(it => it.value === text)?.name ?? ''
}

function showTseZHName (text) {
  return totalTseStatusList.value.find(it => it.value === text)?.name ?? 'Unknown'
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

function showTseTime (item) {
  return '修改时间:' + fromNowTimeDisplay(item.tseStatus?.lastStatusChangedTimestamp) + ' | ' + '更新时间:' + fromNowTimeDisplay(item.tseStatus?.lastUpdateTimestamp)
}

function showCurrentTseColor(text) {
  if (text === 'Unknown') {
    return 'yellow'
  } else if (text === 'Enabled') {
    return 'green'
  } else if (text === 'Disabled') {
    return 'red'
  } else {
    return 'blue'
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

const tseOperatorSchema = computed(() => {
  return {
    title: 'DeviceId:' + selectedDevice?.value?.deviceId + '的tse操作记录',
    subtitle: '可要好好修改，不要改错了',
    schemas: [
      {
        key: 'status',
        name: '状态',
        component: VSelect,
        componentProps: {
          items: [{value: 'Unknown',name: '未知的'},{value: 'Enabled',name: '开启的'},{value: 'Disabled',name: '关闭的'},{value: 'Ignored',name: '忽略的'}],
          itemValue: 'value',
          itemTitle: 'name'
        },
      },
      {
        key: 'note',
        name: '记录内容',
        component: VSelect,
        componentProps: {
          items: [{value: '小橘子',name: '小橘子'},{value: '小菠萝',name: '小菠萝'},{value: '小芒果',name: '小芒果'},{value: '小苹果',name: '小苹果'},{value: '小樱桃',name: '小樱桃'}],
          itemValue: 'value',
          itemTitle: 'name'
        },
        hint: '是谁干的鸭'
      },
    ]
  }
})

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

const dateRange = ref([dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')])
const allUnpaidOrderList = ref([])
function getDateRange (info) {
  dateRange.value = info
}

const selectedOrder = ref({})
const changePaymentDialog = ref(false)
const paymentList = ref([])
const paymentRows = ref([{ paymentId: null, amount: '', couponId: '' }])
const couponErrors = ref({})

// Computed property to calculate the total amount from all payment rows
const totalPaymentAmount = computed(() => {
  return paymentRows.value.reduce((sum, row) => {
    return sum + (parseFloat(row.amount) || 0)
  }, 0).toFixed(2)
})

// Computed property to check if total payment matches order total
const paymentMatchesTotal = computed(() => {
  if (!selectedOrder.value.totalPrice) return true
  const orderTotal = parseFloat(selectedOrder.value.totalPrice)
  return Math.abs(parseFloat(totalPaymentAmount.value) - orderTotal) <= 0.01
})

// Computed property for payment method validation rule
const paymentMethodRules = computed(() => {
  return [
    v => v !== null || '请选择支付方式'
  ]
})

// Computed property for amount validation rule
const amountRules = computed(() => {
  return [
    v => !!v || '请输入金额',
    v => !isNaN(parseFloat(v)) || '请输入有效的金额'
  ]
})

// Computed property for payment total validation message
const paymentTotalValidationMessage = computed(() => {
  if (!paymentMatchesTotal.value && selectedOrder.value.totalPrice) {
    return `支付总额 (${totalPaymentAmount.value}) 与订单金额 (${selectedOrder.value.totalPrice}) 不匹配`
  }
  return ''
})


async function addAppInvite(item) {
  console.log(item, 'item')
  const info = await dialogStore.editItem(inviteSchema)

  info.deviceId = item.deviceId
  const shopInfo = await getShopInfo(info.deviceId)
  console.log(shopInfo, 'shopInfo')
  info.userId = shopInfo.mainUserId
  await dialogStore.waitFor(async () => {
    await createAppInvite(info)
  })
}

const currentBillOrder = ref({})

async function startToEdit (item) {
  selectedOrder.value = item
  currentBillOrder.value = await getDetailOrderInfo(selectedDevice.value.deviceId,item.orderId)
  paymentList.value = await getPaymentMethod(selectedDevice.value.deviceId)
  // Reset payment rows to a single empty row
  paymentRows.value = [{ paymentId: null, amount: '', couponId: '' }]
  changePaymentDialog.value = true
}

function onPaymentSelected(index) {
  // If this is the last row and a payment method is selected, add a new row
  if (index === paymentRows.value.length - 1 && paymentRows.value[index].paymentId !== null) {
    paymentRows.value.push({ paymentId: null, amount: '', couponId: '' })
  }
}

// Function to clear coupon error when the coupon input changes
function clearCouponError(index) {
  if (couponErrors.value[index]) {
    delete couponErrors.value[index]
  }
}

function deletePaymentRow(index) {
  // Don't delete if it's the only row
  if (paymentRows.value.length > 1) {
    paymentRows.value.splice(index, 1)
  }
}

async function savePaymentChanges() {
  // The validation is now handled by the UI components with rules
  // We can skip the validation checks here and rely on the disabled state of the confirm button

  // Reset coupon errors
  couponErrors.value = {}

  // Here you would typically call an API to save the changes
  console.log('Saving payment changes:', {
    orderId: selectedOrder.value.orderId,
    deviceId: selectedDevice.value.deviceId,
    totalAmount: totalPaymentAmount.value,
    payments: paymentRows.value.filter(row => row.paymentId !== null && row.amount !== '')
  })
  const paymentLog = []
  const realPayments = paymentRows.value.filter(row => row.paymentId !== null && row.amount !== '')
  let hasError = false

  for (const paymentIndex in realPayments) {
    realPayments[paymentIndex].index = paymentIndex
    const res = await loadPaymentLog(realPayments[paymentIndex], selectedDevice.value.deviceId)
    console.log(res, 'res')

    // Check if there's an error with the coupon
    if (res && res.error) {
      // Set error for the corresponding coupon field
      couponErrors.value[paymentIndex] = res.message
      hasError = true
    } else if (res) {
      paymentLog.push(res)
    }
  }

  // Only close the dialog if there are no errors
  if (!hasError) {
    const dishesList = currentBillOrder.value.billOrderInfo
    const orderId = selectedOrder.value.orderId
    const consumeTypeId = currentBillOrder.value.billInfo.consumeTypeId
    const discountStr = currentBillOrder.value.billInfo.discountStr
    await checkOutOrder(selectedDevice.value.deviceId, dishesList, paymentLog, orderId , consumeTypeId, discountStr)
    // Close the dialog
    allUnpaidOrderList.value = await getUnpaidOrder(selectedDevice.value.deviceId,dateRange.value)
    changePaymentDialog.value = false
  }
}

// Watch for changes in dateRange and update unpaid orders if dialog is open
watch(dateRange, async (newDateRange) => {
  if (showUnPaidOrderDialog.value && selectedDevice.value) {
    allUnpaidOrderList.value = await getUnpaidOrder(selectedDevice.value.deviceId, newDateRange)
  }
})

const datePicker = useDatePickerStore()

const showUnPaidOrderDialog = ref(false)
const selectedDevice = ref(null)

async function editOrderPayment (item) {
  showUnPaidOrderDialog.value = true
  selectedDevice.value = item
  allUnpaidOrderList.value = await getUnpaidOrder(item.deviceId,dateRange.value)
}

async function changeMaintainceStatus (item) {

  if (!item.needMaintain) {
    const nextNoon = getNextNoonLocalDateTime()
    await maintenanceSchedule({
      deviceId: item.deviceId,
      needMaintain: true,
      nextMaintainDDL: nextNoon,
    })
    await deviceEchoLog.updateDeviceLog()
  }

}
function getNextNoonLocalDateTime() {
  const now = dayjs();
  const todayNoon = now.startOf('day').add(12, 'hour');

  const nextNoon = now.isBefore(todayNoon)
      ? todayNoon
      : todayNoon.add(1, 'day');

  // 返回符合 LocalDateTime 格式的字符串 (YYYY-MM-DDTHH:mm:ss)
  return nextNoon.format('YYYY-MM-DDTHH:mm:ss');
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
  // {
  //   title: 'summaryStatus',
  //   key: 'summaryStatus',
  // },
  {
    title: 'TseStatus',
    key: 'tseStatus.status',
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
        <!--        <v-select-->
        <!--          v-model="deviceEchoLog.summaryStatus"-->
        <!--          label="SummaryStatus"-->
        <!--          clearable-->
        <!--          hide-details-->
        <!--          item-title="name"-->
        <!--          item-value="value"-->
        <!--          :items="totalStatusList"-->
        <!--        />-->
        <v-select
          v-model="deviceEchoLog.tseStatus"
          label="tseStatus"
          clearable
          hide-details
          item-title="name"
          item-value="value"
          :items="totalTseStatusList"
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
          <v-tooltip bottom>
            <template #activator="{props }">
              <div v-bind="props">
                {{ fromNowTimestamp(item.timestamp) }}
              </div>
            </template>
            <span>{{ fromNowTimeDisplay(item.timestamp) }}</span>
          </v-tooltip>
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
        <template #[`item.tseStatus.status`]="{ item }">
          <v-tooltip bottom>
            <template #activator="{props }">
              <div v-bind="props">
                <v-card
                  elevation="0"
                  :color="showCurrentTseColor(item.tseStatus.status)"
                  class="pa-2 d-flex justify-center align-center"
                >
                  {{ showTseZHName(item.tseStatus.status) }}
                </v-card>
              </div>
            </template>
            <div>{{ showTseTime(item) }}</div>
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
        <!--        <template #[`item.summaryStatus`]="{ item }">-->
        <!--          <v-card-->
        <!--            elevation="0"-->
        <!--            :color="showCurrentColor(item.summaryStatus)"-->
        <!--            class="pa-2 d-flex justify-center align-center"-->
        <!--          >-->
        <!--            {{ showZHName(item.summaryStatus) }}-->
        <!--          </v-card>-->
        <!--        </template>-->
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
            <mini-action-button
              :color="item.needMaintain?'green':'grey-lighten-4'"
              text="维护"
              @click="changeMaintainceStatus(item)"
            />
            <mini-action-button
              text="调账"
              @click="editOrderPayment(item)"
            />
            <mini-action-button
              text="邀请码"
              @click="addAppInvite(item)"
            />
            <mini-action-button
              text="TSE"
              @click="editTse(item)"
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
    <v-dialog
      v-model="showUnPaidOrderDialog"
      max-width="800px"
    >
      <v-card class="pa-4">
        <div class="d-flex align-center mb-4">
          <div>
            <div class="text-h5 font-weight-bold">
              调账工具
            </div>
            <div class="text-caption">
              当前门店: {{ selectedDevice?.deviceId }}
            </div>
          </div>
          <v-spacer />
          <date-picker
            v-model="dateRange"
            card-class="pa-3"
            color="blue lighten-3"
            @update:model-value="getDateRange"
          />
        </div>
        <!-- Data display section -->
        <v-card
          outlined
          class="mb-4"
        >
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">
              mdi-file-document-outline
            </v-icon>
            订单数据
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="[
                { title: '订单号', key: 'orderId', align: 'start' },
                { title: '日期', key: 'createTimestamp', align: 'start' },
                { title: '金额', key: 'totalPrice', align: 'end' },
                { title: '支付方式', key: 'paymentMethodName', align: 'center' },
                { title: '操作', key: 'operation', align: 'center' }
              ]"
              :items="allUnpaidOrderList"
              :loading="dialogStore.loading"
              density="compact"
              class="elevation-1"
            >
              <template #[`item.operation`]="{ item }">
                <v-btn
                  size="small"
                  elevation="0"
                  color="orange-lighten-4"
                  @click="startToEdit(item)"
                >
                  调账
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="changePaymentDialog"
      max-width="600px"
    >
      <v-card class="pa-4">
        <!-- Dialog header with title and close button -->
        <div class="d-flex align-center mb-4">
          <div>
            <div class="text-h5 font-weight-bold">
              订单支付调整
            </div>
            <div class="text-caption">
              订单号: {{ selectedOrder.orderId }} | 总金额: {{ selectedOrder.totalPrice }}
            </div>
          </div>
          <v-spacer />
          <v-btn
            icon
            elevation="0"
            @click="changePaymentDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <!-- Payment method section with headers -->
        <div class="mb-4">
          <div class="d-flex mb-2">
            <div
              class="text-subtitle-2 font-weight-medium"
              style="width: 50%"
            >
              支付方式
            </div>
            <div
              class="text-subtitle-2 font-weight-medium"
              style="width: 50%"
            >
              金额
            </div>
          </div>

          <div
            v-for="(row, index) in paymentRows"
            :key="index"
            class="d-flex align-center justify-center mb-3"
          >
            <v-select
              v-model="row.paymentId"
              :items="paymentList"
              item-title="name"
              item-value="id"
              variant="outlined"
              density="comfortable"
              return-object
              class="mr-2"
              style="width: 50%"
              placeholder="选择支付方式"
              :rules="paymentMethodRules"
              @update:model-value="onPaymentSelected(index)"
            />
            <v-text-field
              v-model="row.amount"
              variant="outlined"
              density="comfortable"
              style="width: 50%"
              placeholder="输入金额"
              type="number"
              min="0"
              :rules="amountRules"
            />
            <v-text-field
              v-if="row.paymentId && row.paymentId.id === '4'"
              v-model="row.couponId"
              variant="outlined"
              density="comfortable"
              class="ml-2"
              style="width: 50%"
              placeholder="输入优惠券ID"
              :error="couponErrors[index] !== undefined"
              :error-messages="couponErrors[index]"
              @input="clearCouponError(index)"
            />
            <v-btn
              icon
              elevation="0"
              size="small"
              class="ml-2 mb-4"
              @click="deletePaymentRow(index)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Summary section -->
        <v-card
          variant="outlined"
          class="mb-4 pa-3"
          :color="paymentMatchesTotal ? 'green-lighten-2' : 'red-lighten-2'"
        >
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-subtitle-2 font-weight-medium">
                支付总额
              </div>
              <div class="text-body-2">
                {{ totalPaymentAmount }}
              </div>
            </div>
            <v-divider
              vertical
              class="mx-3"
            />
            <div>
              <div class="text-subtitle-2 font-weight-medium">
                订单金额
              </div>
              <div class="text-body-2">
                {{ selectedOrder.totalPrice }}
              </div>
            </div>
            <v-divider
              vertical
              class="mx-3"
            />
            <div>
              <div class="text-subtitle-2 font-weight-medium">
                差额
              </div>
              <div
                class="text-body-2"
                :class="paymentMatchesTotal ? 'text-success' : 'text-error'"
              >
                {{ (parseFloat(totalPaymentAmount) - parseFloat(selectedOrder.totalPrice)).toFixed(2) }}
              </div>
            </div>
            <v-spacer />
            <v-icon
              :color="paymentMatchesTotal ? 'success' : 'error'"
              size="large"
            >
              {{ paymentMatchesTotal ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
          </div>
          <!-- Error message for payment total validation -->
          <div
            v-if="paymentTotalValidationMessage"
            class="mt-2 text-error text-caption"
          >
            {{ paymentTotalValidationMessage }}
          </div>
        </v-card>

        <!-- Action buttons -->
        <div class="d-flex justify-end">
          <v-btn
            color="grey-lighten-2"
            variant="text"
            class="mr-2"
            @click="changePaymentDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!paymentMatchesTotal"
            @click="savePaymentChanges"
          >
            确认
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>
