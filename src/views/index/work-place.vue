<template>
  <div class="main-container">
    <v-card class="mt-4">
      <v-data-table :items-per-page="-1" :items="deviceLogs" :headers="headers">
        <template #[`item.timestamp`]="{ item }">
          {{ dayjs(item.timestamp).fromNow() }}
        </template>
        <template #[`item.restaurantInfo`]="{ item }">
          {{ formatRestaurantInfo(item.restaurantInfo) }}
        </template>
        <template #[`item.action`]="{ item }">
          <template v-if="item.loading">
            <v-progress-circular indeterminate />
          </template>
          <v-btn v-else @click="updateBackend(item)" color="primary" elevation="0" variant="tonal"
            >更新后端</v-btn
          >
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
  import { getDeviceStatus, getEndPointUrl } from '@/utils/firebase'
  import dayjs from 'dayjs'
  import hillo from 'hillo'

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
    { title: '操作', key: 'action', align: 'end' },
  ])

  function formatRestaurantInfo(restaurantInfoString: any): any {
    return restaurantInfoString?.name ?? ''
  }

  async function updateBackend(item) {
    console.log(item)
    const url = getEndPointUrl(item.deviceId) + 'UpdateSelf.php?op=doUpdate'
    item.loading = true
    const res = await hillo.post(url, { chaos: dayjs().valueOf() })
    console.log(res)
    item.loading = false
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
