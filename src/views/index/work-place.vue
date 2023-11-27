<template>
  <div class="main-container">
    <n-card title="工作台" :content-style="{ padding: '10px' }" :header-style="{ padding: '10px' }">
      <n-grid :cols="4" :y-gap="15" item-responsive responsive="screen">
        <n-grid-item class="flex" span="4 s:2 m:2 l:2 xl:2 2xl:2">
          <div class="avatar-wrapper">
            <img :src="avatar" />
          </div>
          <div class="flex flex-col justify-around ml-3.5 flex-1">
            <div class="text-lg">早上好，冶金难/丁一，新的一天，新的开始，与人为善，贯彻始终</div>
            <div class="text-sm text-gray-500">今日有小雨，出门别忘记带伞哦~</div>
          </div>
        </n-grid-item>
        <n-grid-item class="flex justify-end" span="4 s:2 m:2 l:2 xl:2 2xl:2">
          <div class="flex flex-col justify-around align-end item-action">
            <div class="text-gray">使用新版逻辑的客户数量</div>
            <div class="text-xl">{{ deviceLogs.length }}</div>
          </div>
          <div @click="updateMyFood" class="flex flex-col justify-around align-end item-action">
            <div class="text-gray">中午吃</div>

            <div class="flex items-baseline">
              <div class="text-xl mr-4">{{ myFood }}</div>
              <div class="flex-grow"></div>
              <n-button dashed type="success" size="tiny">换</n-button>
            </div>
          </div>
          <div class="flex flex-col justify-around align-end item-action">
            <div class="text-gray">当前日期</div>
            <div class="text-xl">{{ currentDate }}</div>
          </div>
        </n-grid-item>
      </n-grid>
    </n-card>
    <v-card class="mt-4">
      <v-data-table :items-per-page="-1" :items="deviceLogs" :headers="headers">
        <template #[`item.timestamp`]="{ item }">
          {{ dayjs(item.timestamp).fromNow() }}
        </template>
        <template #[`item.restaurantInfo`]="{ item }">
          {{ formatRestaurantInfo(item.restaurantInfo) }}
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { random } from 'lodash-es'
  import useUserStore from '@/store/modules/user'
  import { getDeviceStatus } from '@/utils/firebase'
  import dayjs from 'dayjs'

  const userStore = useUserStore()
  const avatar = computed(() => userStore.avatar)
  const router = useRouter()

  const myFood = ref('糖醋里脊')

  function updateMyFood() {
    const foods =
      '糖醋里脊 馄饨 拉面 烩面 热干面 刀削面 油泼面 炸酱面 炒面 重庆小面 米线 酸辣粉 土豆粉 螺狮粉 凉皮儿 麻辣烫 肉夹馍 羊肉汤 炒饭 盖浇饭 卤肉饭 烤肉饭 黄焖鸡米饭 驴肉火烧 川菜 麻辣香锅 火锅 酸菜鱼 烤串 披萨 烤鸭 汉堡 炸鸡 寿司 蟹黄包 煎饼果子 生煎 炒年糕'
    const foodArr = foods.split(' ')
    myFood.value = foodArr.at(random(0, foodArr.length - 1)) ?? '糖醋里脊'
  }

  updateMyFood()
  const currentDate = ref(dayjs().toString())
  const deviceLogs = ref([])

  async function updateDeviceLog() {
    deviceLogs.value = await getDeviceStatus()
    console.log(deviceLogs.value)
  }
  const headers = ref([
    {
      title: 'DeviceId',
      key: 'deviceId',
    },
    { title: '访问类型', key: 'accessFrom', align: 'end' },
    { title: '后端版本号', key: 'backendVersion', align: 'end' },
    { title: '前端版本号', key: 'frontendVersion', align: 'end' },
    { title: '最后一次报告时间', key: 'timestamp', align: 'end' },
    { title: '餐馆名称', key: 'restaurantInfo', align: 'end' },
  ])

  function formatRestaurantInfo(restaurantInfoString: any): any {
    return restaurantInfoString?.name ?? ''
  }
  updateDeviceLog()
</script>

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
