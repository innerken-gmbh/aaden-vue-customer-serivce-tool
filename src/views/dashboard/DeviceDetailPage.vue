<script setup>
import {fromNowTimestamp, useDeviceEchoLog} from "@/store/aaden/DeviceEcho";
import PrimaryButton from "@/views/BaseWidget/basic/button/PrimaryButton.vue";
import JSpace from "@/views/BaseWidget/basic/JSpace.vue";
import {useDialogStore} from "@/store/aaden/dialogStore";
import {ref} from "vue";
import PageSubHeader from "@/views/BaseWidget/basic/PageSubHeader.vue";

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

function displayAddress(address) {
  // 将字符串按换行符分割
  const parts = address?.split('\n');
  if (parts)

      // 将每一部分用HTML标签包裹起来
    return `<div class="pa-2">
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
      class="pa-4"
    >
      <page-sub-header>
        机器详情
        <template #subtitle>
          #{{ store.activeDevice.deviceId }}/最后一次报告 {{ fromNowTimestamp(store.activeDevice.timestamp) }}
        </template>
        <template #action>
          <primary-button
            text="增加记录"
            icon="mdi-plus"
            @click="addInfo"
          />
        </template>
      </page-sub-header>
      <j-space gap="24">
        <div v-html="displayAddress(store.activeDevice.deviceName)" />
        <div>
          <j-space class="text-body-2">
            <div class="text-caption">
              Cli版本
            </div>
            {{ store.activeDevice.cliVersion }}
          </j-space>
          <j-space class="text-body-2">
            <div class="text-caption">
              后端版本
            </div>
            {{ store.activeDevice.backendVersion }}
          </j-space>
          <j-space class="text-body-2">
            <div class="text-caption">
              Ngrok
            </div>
            {{ store.activeDevice.ngrokOk }}
          </j-space>
        </div>
        <div>
          <j-space class="text-body-2">
            <div class="text-caption">
              磁盘情况
            </div>
            {{ store.activeDevice.diskUsage }}
          </j-space>
          <j-space class="text-body-2">
            <div class="text-caption">
              开机时间
            </div>
            {{ store.activeDevice.lastUptime }}
          </j-space>
          <j-space class="text-body-2">
            <div class="text-caption">
              备注
            </div>
            {{ store.activeDevice.note }}
          </j-space>
        </div>
      </j-space>

      <v-data-table
        :headers="headers"
        :items="store.eventLogs"
      >
        <template #[`item.createTimestamp`]="{ item }">
          {{ fromNowTimestamp(item.createTimestamp) }}
        </template>
      </v-data-table>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">

</style>
