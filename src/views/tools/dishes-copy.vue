<script setup>
import { computed, reactive, ref } from "vue"
import {getNgrokPHPUrl} from "@/store/aaden/utils";
import {prepareData, uploadPreparedData} from "@/store/aaden/tools/dish-copy";
import dish from '@/store/aaden/model/dish'
import category from '@/store/aaden/model/category'

const deviceId = ref("")
const targetDeviceId = ref("")
const keys = []

function updateKeys (val) {
  keys.length = 0
  keys.push(...val.filter(v => !v.startsWith('category-')))
  console.log(keys)
}

let loading = ref(false)

const dishList = reactive([])
const categoryList = reactive([])
let preparedData = reactive({
  dishesList: [],
  categoryList: [],
  attributeList: [],
  allergenList: [],
  printerGroupList: [],
  attributeGroupList: []
})

const displayDishList = computed(() => {
  const cat = categoryList
  const dish = dishList
  cat.forEach(ct => {
    ct.label = ct.langs[0].name
    ct.key = 'category-' + ct.id
    ct.children = dish.filter(d => d.categoryId === ct.id).map(d => {
      d.label = d.code + '.' + d.dishName
      d.key = d.code
      return d
    })
  })
  return cat
})

const consoleCache = reactive([])

function log (text) {
  consoleCache.push(text)
}

const consoleDisplay = computed(() => {
  const arr = consoleCache
  return arr.reverse()
})

async function prepare () {
  loading.value = true
  consoleCache.length = 0
  const res = await prepareData(deviceId.value, new Set(keys), targetDeviceId.value)
  Object.assign(preparedData, res)
  console.log(preparedData)
  loading.value = false
}

async function paste () {
  await uploadPreparedData(preparedData, targetDeviceId.value, log, deviceId.value)
}

async function updateDeviceId () {
  console.log(deviceId.value)
  try {
    dishList.length = 0
    categoryList.length = 0
    dishList.push(...await dish.load(getNgrokPHPUrl(deviceId.value)))
    categoryList.push(...await category.load(getNgrokPHPUrl(deviceId.value)))
  } catch (e) {
    console.warn('we got error', e)
  }

}
</script>

<template>
  <div style="padding: 16px">
    <div class="text-h5">
      复制粘贴
    </div>
    <div style="display: grid;grid-template-columns: repeat(2,1fr)">
      <div>
        <div style="display: flex">
          <n-input
            v-model:value="deviceId"
            :placeholder="'老的DeviceId'"
          />
          <n-button @click="updateDeviceId">
            查询
          </n-button>
        </div>
        <template v-if="displayDishList">
          <n-tree
            :data="displayDishList"
            checkable
            cascade
            @update-checked-keys="updateKeys"
          />
        </template>
      </div>
      <div>
        <div style="display: flex">
          <n-input
            v-model:value="targetDeviceId"
            :placeholder="'新的DeviceId'"
          />
          <n-button
            :loading="loading"
            @click="prepare"
          >
            准备数据
          </n-button>
          <n-button
            v-if="preparedData.dishesList.length>0"
            type="primary"
            @click="paste"
          >
            开始上传!
          </n-button>
        </div>
        <div
          v-if="consoleDisplay.length>0"
          style="max-height: calc(100vh - 300px);overflow: scroll;padding: 16px;"
        >
          <template v-for="info in consoleDisplay">
            <p>{{ info }}</p>
          </template>
        </div>
        <div
          v-if="preparedData.dishesList.length>0"
          style="padding: 16px"
        >
          <template
            v-for="key in Object.keys(preparedData)"
            :key="key"
          >
            <template v-if="key==='dishesList'">
              <h3>将会上传 {{ preparedData.dishesList.length }} 个菜品.</h3>
              <template
                v-for="dish in preparedData.dishesList"
                :key="dish.code"
              >
                <p>{{ dish.code }}.{{ dish.dishName }}</p>
              </template>
            </template>
            <template v-else>
              <h3>将会上传 {{ preparedData[key].length }}个 {{ key.replace('List', '') }}.</h3>
              <template
                v-for="item in preparedData[key]"
                :key="item.id"
              >
                <p>
                  {{ item.name ?? '无名称' }}/{{
                    item.idRemote ? '将会使用远程的' + item.idRemote : '需要重新上传'
                  }}
                </p>
              </template>
            </template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>


<style>
</style>
