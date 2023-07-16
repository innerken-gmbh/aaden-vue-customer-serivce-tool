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
            <div class="text-gray">客户数量</div>
            <div class="text-xl">506</div>
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
    <n-grid
      class="mt-4 mb-4"
      :y-gap="15"
      :x-gap="15"
      cols="2 s:2 m:3 l:6 xl:6 2xl:6"
      responsive="screen"
    >
      <n-grid-item v-for="(item, index) of fastActions" :key="index">
        <n-card @click="fastActionClick(item)">
          <div class="flex flex-col items-center justify-center">
            <span
              :class="[item.icon, 'iconfont']"
              :style="{ color: item.color, fontSize: '30px' }"
            ></span>
            <span class="mt-1">{{ item.title }}</span>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-grid
      class="mt-4 mb-4"
      :y-gap="15"
      :x-gap="15"
      cols="2 s:2 m:3 l:6 xl:6 2xl:6"
      responsive="screen"
    >
      <n-grid-item v-for="(item, index) of dataItems" :key="index">
        <ProjectItem :item="item" />
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script lang="ts">
  import ProjectItem from './components/ProjectItem.vue'
  import { computed, defineComponent, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { random } from 'lodash-es'
  import useUserStore from '@/store/modules/user'
  import { DeviceType } from '@/store/types'
  import useAppConfigStore from '@/store/modules/app-config'

  const COLORS = ['#67C23A', '#E6A23C', '#F56C6C', '#409EFF']
  const date = new Date()
  export default defineComponent({
    name: 'WorkPlace',
    components: {
      ProjectItem,
    },
    setup() {
      const appConfigStore = useAppConfigStore()
      const isMobileScreen = computed(() => {
        return appConfigStore.deviceType === DeviceType.MOBILE
      })
      const userStore = useUserStore()
      const avatar = computed(() => userStore.avatar)
      const router = useRouter()
      const fastActionClick = ({ path = '/' }) => {
        router.push(path)
      }

      const myFood = ref('糖醋里脊')
      function updateMyFood() {
        const foods =
          '糖醋里脊 馄饨 拉面 烩面 热干面 刀削面 油泼面 炸酱面 炒面 重庆小面 米线 酸辣粉 土豆粉 螺狮粉 凉皮儿 麻辣烫 肉夹馍 羊肉汤 炒饭 盖浇饭 卤肉饭 烤肉饭 黄焖鸡米饭 驴肉火烧 川菜 麻辣香锅 火锅 酸菜鱼 烤串 披萨 烤鸭 汉堡 炸鸡 寿司 蟹黄包 煎饼果子 生煎 炒年糕'
        const foodArr = foods.split(' ')
        myFood.value = foodArr.at(random(0, foodArr.length - 1)) ?? '糖醋里脊'
      }
      updateMyFood()

      return {
        isMobileScreen,
        avatar,
        updateMyFood,
        currentDate: date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate(),
        dataItems: [
          {
            title: 'Aaden POS 中台',
            target: 'https://admin.aaden.io',
            gitee: 'http://www.vueadminwork.com',
            ui: '精心打造',
          },
          {
            title: '谷歌翻译',
            target: 'https://translate.google.com',
            gitee: 'http://www.vueadminwork.com',
            ui: '精心打造',
          },
        ],
        fastActions: [
          {
            title: '首页',
            icon: 'icon-dashboard-fill',
            path: '/',
            color: COLORS[random(0, COLORS.length)],
          },
          {
            title: '商品复制',
            path: '/list/copy',
            icon: 'icon-setting-fill',
            color: COLORS[random(0, COLORS.length)],
          },
          {
            title: '外卖开通',
            path: '/form/manage',
            icon: 'icon-detail-fill',
            color: COLORS[random(0, COLORS.length)],
          },
          {
            title: '敬请期待',
            path: '/form/base-form-view',
            icon: 'icon-file-text-fill',
            color: COLORS[random(0, COLORS.length)],
          },
          {
            title: '敬请期待',
            path: '/next/menu2/menu-2-1/menu-2-1-1',
            icon: 'icon-golden-fill',
            color: COLORS[random(0, COLORS.length)],
          },
          {
            title: '敬请期待',
            path: '/other/qrcode',
            icon: 'icon-appstore-fill',
            color: COLORS[random(0, COLORS.length)],
          },
        ],
        fastActionClick,
        myFood,
        columns: [
          {
            title: '项目名',
            key: 'projectName',
          },
          {
            title: '开始时间',
            key: 'beginTime',
          },
          {
            title: '结束时间',
            key: 'endTime',
          },
          {
            title: '进度',
            key: 'progress',
          },
          {
            title: '状态',
            key: 'status',
          },
        ],
      }
    },
  })
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
