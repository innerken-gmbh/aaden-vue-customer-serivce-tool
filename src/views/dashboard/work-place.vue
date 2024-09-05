<script lang="ts" setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {random} from 'lodash-es'
import {fromNowTimestamp, useDeviceEchoLog} from '@/store/aaden/DeviceEcho'

const deviceEchoLog = useDeviceEchoLog()
const myFood = ref('糖醋里脊')

function updateMyFood() {
  const foods =
      '糖醋里脊 馄饨 拉面 烩面 热干面 刀削面 油泼面 炸酱面 炒面 重庆小面 米线 酸辣粉 土豆粉 螺狮粉 凉皮儿 麻辣烫 肉夹馍 ' +
      '羊肉汤 炒饭 盖浇饭 卤肉饭 烤肉饭 黄焖鸡米饭 驴肉火烧 川菜 麻辣香锅 火锅 酸菜鱼 烤串 披萨 烤鸭 ' +
      '汉堡 炸鸡 寿司 蟹黄包 煎饼果子 生煎 炒年糕'
  const foodArr = foods.split(' ')
  myFood.value = foodArr.at(random(0, foodArr.length - 1)) ?? '糖醋里脊'
}

onMounted(() => {
  const clear = setInterval(deviceEchoLog.updateDeviceLog, 10 * 1000)
  onBeforeUnmount(() => {
    clearInterval(clear)
  })
})

updateMyFood()

function getRowProp(data: any) {
  const props= {
    key: data.item.deviceId
  }
  if(deviceEchoLog.cliVersionOk(data)&&deviceEchoLog.backgroundVersionOk(data)&&deviceEchoLog.diskOk(data)){
    props.class="bg-green-lighten-5"
  }
  return props
}

const headers = ref([
  {title: '操作', key: 'action', align: 'start'},
  {
    title: 'DeviceId',
    key: 'deviceId',
  },
  {title: 'cliVersion', key: 'cliVersion', align: 'end'},
  {title: 'backendVersion', key: 'backendVersion', align: 'end'},
  {title: '磁盘情况', key: 'diskUsage', align: 'end'},
  {title: '最后一次报告时间', key: 'timestamp', align: 'end'},
])

function formatRestaurantInfo(restaurantInfoString: { name?: string }): string {
  return (restaurantInfoString?.name ?? '').substring(0, 24)
}

function canUpdateBackend(backendVersion: string): boolean {
  return deviceEchoLog.currentBackendVersion !== backendVersion
      && backendVersion > "1.7.853"
}

deviceEchoLog.updateDeviceLog()
</script>

<template>
  <div class="main-container">
    <v-card class="mt-4">
      <div
        class="text-body-2 d-flex"
      >
        <v-sheet
          color="grey-lighten-4"
          class="pa-4"
        >
          上次刷新时间:{{ deviceEchoLog.lastUpdateTimestamp }}
        </v-sheet>
        <v-sheet
          color="grey-lighten-3"
          class="pa-4"
        >
          结果总数:{{ deviceEchoLog.activeDeviceLogs.length }}
        </v-sheet>
        <v-sheet
          class="pa-4"
          color="grey-lighten-4"
        >
          最新版本后端:{{ deviceEchoLog.currentBackendVersion }}
          ({{
            deviceEchoLog.activeDeviceLogs.filter(deviceEchoLog.backgroundVersionOk).length
          }})
        </v-sheet>
        <v-sheet
          class="pa-4"
          color="grey-lighten-3"
        >
          Cli版本:{{ deviceEchoLog.cliVersion }}
          ({{
            deviceEchoLog.activeDeviceLogs.filter(deviceEchoLog.cliVersionOk).length
          }})
        </v-sheet>
        <v-sheet
          color="yellow-darken-4"
          class="pa-4"
        >
          磁盘警告:
          ({{
            deviceEchoLog.activeDeviceLogs.filter(it=>!deviceEchoLog.diskOk(it)).length
          }})
        </v-sheet>
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
      >
        <template #[`item.timestamp`]="{ item }">
          {{ fromNowTimestamp(item.timestamp) }}
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
          <div>
            <v-sheet :color="deviceEchoLog.cliVersionOk(item)?'green':'red'">
              {{ item.cliVersion }}
            </v-sheet>
          </div>
        </template>
        <template #[`item.diskUsage`]="{ item }">
          {{ item.diskUsage }}
        </template>
        <template #[`item.action`]="{ item }">
          <template v-if="item.loading">
            <v-progress-circular indeterminate />
          </template>
          <v-btn
            v-else
            :disabled="!canUpdateBackend(item.backendVersion)"
            color="primary"
            elevation="0"
            variant="tonal"
            @click="deviceEchoLog.updateBackend(item)"
          >
            更新后端
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style lang="scss" scoped>
.avatar-wrapper {
  width: 3rem;
  height: 3rem;
  max-width: 3rem;
  max-height: 3rem;
  min-width: 3rem;
  min-height: 3rem;

  & > img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid var(--primary-color);
  }
}

.item-action {
  position: relative;
  padding: 0 30px;
}

.item-action::after {
  position: absolute;
  top: 20%;
  right: 0;
  height: 60%;
  content: '';
  display: block;
  width: 1px;
  background-color: #e0e0e0;
}

div.item-action:last-child::after {
  width: 0;
}

.fast-item-wrapper {
  border-right: 1px solid #f7f7f7;
  border-bottom: 1px solid #f7f7f7;
  height: 80px;
}

.fast-item-wrapper:hover {
  cursor: pointer;
  box-shadow: 0px 0px 10px #ddd;
}

.el-link + .el-link {
  margin-bottom: 10px;
}
</style>
