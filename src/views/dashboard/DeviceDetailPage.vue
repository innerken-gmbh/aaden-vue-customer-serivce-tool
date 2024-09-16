<script setup>
import {fromNowTimestamp, useDeviceEchoLog} from "@/store/aaden/DeviceEcho";
import PrimaryButton from "@/views/BaseWidget/basic/button/PrimaryButton.vue";
import {useDialogStore} from "@/store/aaden/dialogStore";
import {ref} from "vue";
import PageSubHeader from "@/views/BaseWidget/basic/PageSubHeader.vue";
import SecondaryButton from "@/views/BaseWidget/basic/button/SecondaryButton.vue";
import JSpace from "@/views/BaseWidget/basic/JSpace.vue";
import LoadingProvider from "@/views/BaseWidget/basic/premade/LoadingProvider.vue";

const store = useDeviceEchoLog()
const schema = {
  title: '新增事件记录',
  subtitle: '可要好好修改，不要改错了',
  schemas: [
    {
      key: 'content',
      name: '记录内容',
      required: true,
      default: "",
      hint: '发生什么事了'
    },
    {
      key: 'type',
      name: '记录类型',
      hint: '想写什么写什么',
      default: "人工操作",
    },
    {
      key: 'operator',
      name: '操作人员',
      hint: '是谁干的好事',
      default: "刘畅",
    },
  ]
}
const tab = ref(0)
const dialogStore = useDialogStore()

async function addInfo() {
  const info = await dialogStore.editItem(schema)
  console.log(info)
  info.deviceId = store.activeDevice.deviceId
  await dialogStore.waitFor(async () => {
    await store.addEventLog(info)
  })
}

const headers = ref([
  {title: '记录时间', key: 'createTimestamp',},
  {title: '操作员', key: 'operator'},
  {title: '操作类型', key: 'type'},
  {title: '记录内容', key: 'content', align: 'end'},
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
          </v-tabs-window>
        </v-card>
      </loading-provider>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">

</style>
