<template>
  <div class="main-container p-4">
    <n-h3>标签信息</n-h3>
    <n-space>
      <n-form-item label="标签名称">
        <n-input v-model:value="categoryName" />
      </n-form-item>
      <n-form-item label="标签类型">
        <n-input v-model:value="categoryType" />
      </n-form-item>
    </n-space>
    <n-h3>菜品信息</n-h3>
    <n-space
      v-for="i in uploadInfo"
      :key="i"
    >
      <n-form-item
        v-for="info in i.field"
        :key="info.field"
        :label="info.label"
      >
        <n-input v-model:value="i.item[info.field]" />
      </n-form-item>
    </n-space>
    <div class="my-2">
      <n-space>
        <n-button
          type="info"
          @click="addEmptyDish"
        >
          继续添加
        </n-button>
        <n-button
          type="warning"
          @click="save"
        >
          保存输入内容
        </n-button>
        <n-button
          type="success"
          @click="load"
        >
          加载
        </n-button>
        <n-button
          type="error"
          @click="clear"
        >
          全部清空
        </n-button>
      </n-space>
    </div>
    <div class="my-4">
      <n-space>
        <n-input
          v-model:value="deviceId"
          placeholder="设备ID"
        />
        <n-button
          type="primary"
          :loading="loading"
          @click="doUpload"
        >
          上传
        </n-button>
      </n-space>
    </div>

    <div class="my-4 p-4 bg-white">
      <n-code>
        {{ uploadInfo.map((it) => it.item) }}
      </n-code>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {reactive, ref} from 'vue'
import hillo from 'hillo'
import {dishBuilder} from 'src/i18n'
import {useMessage} from 'naive-ui'
import {IKUtils} from 'innerken-js-utils'

const deviceId = ref('')
  const categoryName = ref('')
  const categoryType = ref('9')

  const loading = ref(false)

  const dishInfo = [
    {
      field: 'code',
      label: '菜号',
      required: true,
    },
    {
      field: 'name',
      label: '名称',
      required: true,
    },
    {
      field: 'price',
      label: '价格',
      required: true,
    },
    {
      field: 'printGroupId',
      label: '打印组',
      required: true,
    },

    {
      field: 'copyAttributeName',
      label: '从某菜品复制属性（可不填）',
      required: false,
    },
  ]
  const key = 'cs-cache-upload-info'
  function save() {
    localStorage[key] = JSON.stringify(uploadInfo)
  }
  function load() {
    try {
      const info = JSON.parse(localStorage[key])
      Object.assign(uploadInfo, info)
    } catch (e) {}
  }

  function clear() {
    try {
      uploadInfo.length = 0
      addEmptyDish()
      addEmptyDish()
    } catch (e) {}
  }

  const uploadInfo: any[] = reactive([])

  function init() {
    addEmptyDish()
    addEmptyDish()
  }

  function addEmptyDish() {
    const field = IKUtils.deepCopy(dishInfo)
    uploadInfo.push({ field: field, item: {} })
  }

  init()

  async function uploadDishIfNotExist(dishInfo) {
    const currentDishList = (await hillo.get('Dishes.php')).content
    if (currentDishList.some((it) => it.code === dishInfo.code)) {
      message.warning('菜品重复' + dishInfo.code)
      return
    } else {
      const res = await hillo.post('Dishes.php?op=add', dishInfo)
      if (res?.status !== 'good') {
        throw Error(res?.info ?? '网络错误')
      }
    }
  }

  const message = useMessage()

  async function doUpload() {
    loading.value = true
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
    if (!categoryName.value) {
      message.error('请输入标签名字')
    }

    const categoryInfo = {
      catTypeId: categoryType.value,
      langs: JSON.stringify([
        { name: categoryName.value, lang: 'ZH' },
        { name: categoryName.value, lang: 'DE' },
        { name: categoryName.value, lang: 'EN' },
      ]),
      printOrder: 10,
    }
    try {
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
      for (const info of uploadInfo) {
        let shouldUpload = true
        for (const f of info.field) {
          if (f.required && !info.item[f.field]) {
            shouldUpload = false
          }
        }
        if (shouldUpload) {
          const dishInfo = dishBuilder({
            price: info.item.price,
            categoryId: existId,
            code: info.item.code,
            printGroupId: info.item.printGroupId,
            langs: [
              { name: info.item.name, lang: 'ZH' },
              { name: info.item.name, lang: 'DE' },
              { name: info.item.name, lang: 'EN' },
            ],
          })
          if (info.item.copyAttributeName) {
            await dishInfo.copyFrom(
              info.item.copyAttributeName,
              'attributeGroup',
              'localAttributeGroupId'
            )
          }
          await uploadDishIfNotExist(dishInfo.prepareForUpload())
        }
      }
      message.success('全部上传成功')
      deviceId.value = ''
    } catch (e) {
      console.log(e, 'error')
      message.error('上传失败' + e?.message)
    }
    loading.value = false
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
