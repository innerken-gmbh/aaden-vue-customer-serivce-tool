<template>
  <div class="main-container pa-4">
    <n-space>
      <n-form-item label="Blade · Stairways to Heaven 价格">
        <n-input v-model:value="price1" />
      </n-form-item>
      <n-form-item label="Blade · Stairways to Heaven 复制属性组名称">
        <n-input v-model:value="attrName1" />
      </n-form-item>
    </n-space>
    <n-space>
      <n-form-item label="Kafka · Gun & Roses 价格">
        <n-input v-model:value="price2" />
      </n-form-item>
      <n-form-item label="Kafka · Gun & Roses 复制属性组名称">
        <n-input v-model:value="attrName2" />
      </n-form-item>
    </n-space>

    <n-space>
      <n-input v-model:value="deviceId" placeholder="设备ID" />
      <n-button @click="doUpload"> 上传</n-button>
    </n-space>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'
  import hillo from 'hillo'
  import { dishBuilder } from '@/i18n'
  import { useMessage } from 'naive-ui'

  const deviceId = ref('')

  const price1 = ref('5.7')
  const price2 = ref('5.5')
  const attrName1 = ref('蓝莓冰茶')
  const attrName2 = ref('青柠香柚')
  const categoryInfo = {
    catTypeId: 9,
    langs: JSON.stringify([
      { name: 'Star Rail', lang: 'ZH' },
      { name: 'Star Rail', lang: 'DE' },
      { name: 'Star Rail', lang: 'EN' },
    ]),
    printOrder: 10,
  }

  async function uploadDishIfNotExist(dishInfo) {
    const currentDishList = (await hillo.get('Dishes.php')).content
    if (currentDishList.some((it) => it.code === dishInfo.code)) {
      message.warning('菜品重复' + dishInfo.code)
      return
    } else {
      const id = (await hillo.post('Dishes.php?op=add', dishInfo))?.content?.id
    }
  }
  const message = useMessage()
  async function doUpload() {
    const ngrokUrl = 'ik' + deviceId.value.padStart(4, '0') + '.ngrok.aaden.io'
    hillo.use({
      errorHandler<T>(data: any) {
        message.error(data?.message)
      },
      isDebug: false,
      productionUrl: 'http://' + ngrokUrl + '/PHP/',
      debugUrl: 'http://' + ngrokUrl + '/PHP/',
      LoadingUtils: {
        showLoading: function () {},
        hideLoading: function () {},
        showError: function () {},
      },
      refreshHeader: function () {
        return ''
      },
      tokenRefresh: function (value: string) {
        return value
      },
    })
    const currentCategoryList = (await hillo.get('Category.php')).content
    console.log(currentCategoryList)
    let existId = currentCategoryList.find((it: any) => {
      return it?.langs?.some((that: { name: string }) => that?.name === 'Star Rail')
    })?.id
    if (!existId) {
      const id = (await hillo.post('Category.php?op=add', categoryInfo))?.content?.id
      console.log(id)
      existId = id
    }

    console.log(existId, 'currentCategoryId')
    const currentDishList = (await hillo.get('Dishes.php')).content
    console.log(currentDishList, 'dish')
    const dishInfo1 = dishBuilder({
      price: price1.value,
      categoryId: existId,
      printGroupId: 8,
      langs: [
        { name: 'Blade · Stairways to Heaven', lang: 'ZH' },
        { name: 'Blade · Stairways to Heaven', lang: 'DE' },
        { name: 'Blade · Stairways to Heaven', lang: 'EN' },
      ],
      code: 'rr1',
      attributeGroup: [],
    })
    const dishInfo2 = dishBuilder({
      price: price2.value,
      categoryId: existId,
      printGroupId: 8,
      langs: [
        { name: 'Kafka · Gun & Roses', lang: 'ZH' },
        { name: 'Kafka · Gun & Roses', lang: 'DE' },
        { name: 'Kafka · Gun & Roses', lang: 'EN' },
      ],
      code: 'rr2',
      attributeGroup: [],
    })
    try {
      await dishInfo1.copyFrom(attrName1.value, 'attributeGroup', 'localAttributeGroupId')
      await uploadDishIfNotExist(dishInfo1.prepareForUpload())
      await dishInfo2.copyFrom(attrName2.value, 'attributeGroup', 'localAttributeGroupId')
      await uploadDishIfNotExist(dishInfo2.prepareForUpload())
      message.success('上传成功！')
    } catch (e) {
      console.log(e)
      message.error(e?.message)
    }
  }
</script>

<style lang="scss" scoped>
  .avatar-container {
    position: relative;
    width: 30px;
    height: 30px;
    margin: 0 auto;
    vertical-align: middle;

    .avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }

    .avatar-vip {
      border: 2px solid #cece1e;
    }

    .vip {
      position: absolute;
      top: 0;
      right: -9px;
      width: 15px;
      transform: rotate(60deg);
    }
  }

  .gender-container {
    .gender-icon {
      width: 20px;
    }
  }
</style>
