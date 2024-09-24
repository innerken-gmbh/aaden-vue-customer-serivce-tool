<script setup>
import {fromNowTimestamp, useDeviceEchoLog} from "@/store/aaden/DeviceEcho";
import PrimaryButton from "@/views/BaseWidget/basic/button/PrimaryButton.vue";
import {useDialogStore} from "@/store/aaden/dialogStore";
import {computed, onMounted, ref, watch} from "vue";
import PageSubHeader from "@/views/BaseWidget/basic/PageSubHeader.vue";
import SecondaryButton from "@/views/BaseWidget/basic/button/SecondaryButton.vue";
import JSpace from "@/views/BaseWidget/basic/JSpace.vue";
import LoadingProvider from "@/views/BaseWidget/basic/premade/LoadingProvider.vue";
import {recordSchema} from "@/old/utils/recordSchema";
import {getDeviceSubscriptionList, getLogsByDeviceId} from "@/store/aaden/cloud-v2-api";
import {getZHProductName,getDateProgressLinear,formatDate,formatPriceDisplay,showCurrentBillType} from "@/store/aaden/saasSubscription";


const store = useDeviceEchoLog()
const tab = ref(0)
const dialogStore = useDialogStore()
const logInfo = ref([])
const subInfo = ref([])

watch(store,async (value) => {
  if (value) {
    logInfo.value = await getLogsByDeviceId(store?.activeDevice?.deviceId)
    subInfo.value = await getDeviceSubscriptionList(store?.activeDevice?.deviceId)
  }
})

async function addInfo() {
  const info = await dialogStore.editItem(recordSchema)
  console.log(info)
  info.deviceId = store.activeDevice.deviceId
  await dialogStore.waitFor(async () => {
    await store.addEventLog(info)
  })
}

async function stopAutoUpdate (value) {
  let info = {}
  if (value === '1') {
    info.maxVersion = '1.1.1'
  } else {
    info.maxVersion = '-1'
  }
  info.deviceId = store.activeDevice.deviceId
  info.deviceGroup = store.activeDevice.deviceGroup
  await store.updateDeviceLogInfo(info.deviceId, info.deviceGroup, info.maxVersion)
  store.showDetail = false

}

const currentMaxVersion = computed(() => {
  return store.activeDevice.maxVersion
})

const headers = ref([
  {title: '记录时间', key: 'createTimestamp',},
  {title: '操作员', key: 'operator'},
  {title: '操作类型', key: 'type'},
  {title: '记录内容', key: 'content', align: 'end'},
])

const logHeader = ref([
  {title: '前端类型', key: 'frontendType',},
  {title: '域名', key: 'uuid'},
  {title: '版本', key: 'version', align: 'end', width: 100},
])

const subHeader = ref([
  {title: '邮箱', key: 'customerEmail',},
  {title: '项目名称', key: 'productZHName'},
  {title: '项目进度', key: 'subLinear'},
  {title: '截止时间', key: 'subscriptionEndDate'},
])
const emit = defineEmits(['ngrok'])

function displayAddress(address) {
  // 将字符串按换行符分割
  const parts = address?.split('\n');
  if (parts)

      // 将每一部分用HTML标签包裹起来
    return `<div class="">
                    <b>${parts[0]}</b><br>
                    ${parts[1]}<br>
                    ${parts[2]}
                </div>`;
  else return ""
}

</script>

<template>
  <v-dialog
    v-model="store.showDetail"
    max-width="660"
  >
    <v-card
      v-if="store.showDetail"
    >
      <loading-provider :loading="store.detailLoading">
        <v-card
          variant="flat"
          color="grey-lighten-4"
          class="pa-4 pb-0"
        >
          <page-sub-header>
            机器详情
            <template #subtitle>
              #{{ store.activeDevice.deviceId }}/最后一次报告 {{ fromNowTimestamp(store.activeDevice.timestamp) }}
            </template>
            <template #action>
              <j-space>
                <secondary-button
                  v-if="currentMaxVersion === '1.1.1'"
                  icon="mdi-reload"
                  @click="stopAutoUpdate('0')"
                >
                  继续更新
                </secondary-button>
                <secondary-button
                  v-else
                  icon="mdi-alert"
                  @click="stopAutoUpdate('1')"
                >
                  暂停更新
                </secondary-button>
                <secondary-button
                  icon="mdi-wifi"
                  @click="emit('ngrok')"
                >
                  Ngrok
                </secondary-button>
                <primary-button
                  text="增加记录"
                  icon="mdi-plus"
                  @click="addInfo"
                />
              </j-space>
            </template>
          </page-sub-header>
          <v-tabs v-model="tab">
            <v-tab>操作记录</v-tab>
            <v-tab>详情</v-tab>
            <v-tab>Ngrok连接情况</v-tab>
            <v-tab>前端情况</v-tab>
            <v-tab>门店订阅</v-tab>
          </v-tabs>
        </v-card>
        <v-card
          flat
          class="pa-4"
        >
          <v-tabs-window
            v-model="tab"
            style="width: 100%"
          >
            <v-tabs-window-item>
              <v-data-table
                :headers="headers"
                :items="store.eventLogs"
              >
                <template #[`item.createTimestamp`]="{ item }">
                  {{ fromNowTimestamp(item.createTimestamp) }}
                </template>
              </v-data-table>
            </v-tabs-window-item>
            <v-tabs-window-item style="width: 100%">
              <div
                class="d-flex mb-2"
                style="width: 100%"
              >
                <div class="text-body-2">
                  餐厅信息
                </div>
                <v-spacer />
                <div
                  class="text-right"
                  v-html="displayAddress(store.activeDevice.deviceName)"
                />
              </div>
              <div
                class="d-flex mb-2"
                style="width: 100%"
              >
                <div class="text-body-2">
                  Cli版本
                </div>
                <v-spacer />
                <div>{{ store.activeDevice.cliVersion }}</div>
              </div>
              <div
                class="d-flex mb-2"
                style="width: 100%"
              >
                <div class="text-body-2">
                  后端版本
                </div>
                <v-spacer />
                <div>{{ store.activeDevice.backendVersion }}</div>
              </div>
              <div
                class="d-flex mb-2"
                style="width: 100%"
              >
                <div class="text-body-2">
                  Ngrok
                </div>
                <v-spacer />
                <div>{{ store.activeDevice.ngrokOk }}</div>
              </div>

              <div
                class="d-flex mb-2"
                style="width: 100%"
              >
                <div class="text-body-2">
                  磁盘情况
                </div>
                <v-spacer />
                <div>{{ store.activeDevice.diskUsage }}</div>
              </div>

              <div
                class="d-flex mb-2"
                style="width: 100%"
              >
                <div class="text-body-2">
                  开机时间
                </div>
                <v-spacer />
                <div>{{ store.activeDevice.lastUptime }}</div>
              </div>
              <div
                class="d-flex mb-2"
                style="width: 100%"
              >
                <div class="text-body-2">
                  注册时间
                </div>
                <v-spacer />
                <div>{{ fromNowTimestamp(store.activeDevice.createTimestamp) }}</div>
              </div>
              <div
                class="d-flex mb-2"
                style="width: 100%"
              >
                <div class="text-body-2">
                  备注
                </div>
                <v-spacer />
                <div>{{ store.activeDevice.note ?? '-' }}</div>
              </div>
            </v-tabs-window-item>
            <v-tabs-window-item>
              每一格代表15分钟,由新到旧,每一行代表6个小时
              <div style="display: grid;grid-template-columns: repeat(24,minmax(0,1fr));grid-gap: 2px">
                <v-tooltip
                  v-for="ng in store.recentNgrokStatus"
                  :key="ng.id"
                  :text="ng.createTimestamp"
                >
                  <template #activator="{ props }">
                    <v-card

                      v-bind="props"
                      rounded="0"
                      flat
                      :color="ng.ngrokOk?'green-darken-4':'red-darken-4'"
                    >
                      <v-responsive :aspect-ratio="1" />
                    </v-card>
                  </template>
                </v-tooltip>
              </div>
            </v-tabs-window-item>
            <v-tabs-window-item>
              <v-data-table
                :headers="logHeader"
                :items="logInfo"
              />
            </v-tabs-window-item>
            <v-tabs-window-item>
              <v-data-table
                :headers="subHeader"
                :items="subInfo"
              >
                <template #[`item.productZHName`]="{ item }">
                  {{ getZHProductName(item.productCode) }}/{{ showCurrentBillType(item.billingCycle) }}
                </template>
                <template #[`item.subscriptionEndDate`]="{ item }">
                  {{
                    formatDate(item.subscriptionEndDate)
                  }}
                </template>
                <template #[`item.subLinear`]="{ item }">
                  <v-progress-linear
                    :model-value="getDateProgressLinear(item.subscriptionStartDate,item.subscriptionEndDate)"
                    height="20"
                    color="info"
                    rounded
                  >
                    <template #default="{ value }">
                      <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                  </v-progress-linear>
                </template>
              </v-data-table>
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </loading-provider>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">

</style>
