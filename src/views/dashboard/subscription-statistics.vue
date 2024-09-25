<script setup>
import {computed, onMounted, ref} from 'vue'
import LoadingProvider from "@/views/BaseWidget/basic/premade/LoadingProvider.vue";
import {getAllSubscriptionList} from "@/store/aaden/cloud-v2-api";
import {groupBy} from "lodash-es";
import {getProductNameByCode} from "@/store/aaden/saasSubscription";
import router from "@/router";
import {cardColorList} from "@/store/aaden/saasSubscription";



onMounted(async () => {
  await reload()
})

const loading = ref(false)
const allSubscriptionList = ref([])

async function reload() {
  loading.value = true
  allSubscriptionList.value = (await getAllSubscriptionList())
  loading.value = false
}

const groupByStatus = computed(() => {
  let currentList = []
  const res = groupBy(allSubscriptionList.value,'status')
  for (const item in res) {
    currentList.push({status: item,value:res[item]})
  }
  return currentList
})

const groupByProducts = computed(() => {
  let currentList = []
  const res = groupBy(allSubscriptionList.value,'productCode')
  for (const item in res) {
    currentList.push({product: item,value:groupBy(res[item],'status')})
  }
  return currentList
})
function pushToDetail (item) {
  router.push('/dashboard/subscription-detail?Code=' + item.product)
}
function pushToDetailByStatus (item) {
  router.push('/dashboard/subscription-detail?Status=' + item.status)
}
</script>

<template>
  <div class="px-4">
    <loading-provider :loading="loading">
      <div
        class="mt-4"
        style="display: grid;grid-gap: 20px;grid-template-columns: repeat(5,minmax(0,1fr))"
      >
        <div
          v-for="(c,index) in groupByStatus"
          :key="index"
        >
          <v-card
            :color="cardColorList[index % 18]"
            elevation="0"
            min-height="200px"
            class="pa-4"
            @click="pushToDetailByStatus(c)"
          >
            <div class="text-h6 mb-10">
              {{ c.status }}
            </div>

            <div class="d-flex justify-center align-center">
              <div>
                总数：
              </div>
              <v-spacer />
              <div>
                {{ c.value.length }}
              </div>
            </div>
          </v-card>
        </div>
      </div>
      <div
        class="mt-4"
        style="display: grid;grid-gap: 20px;grid-template-columns: repeat(5,minmax(0,1fr))"
      >
        <div
          v-for="(item,index) in groupByProducts"
          :key="index"
        >
          <v-card
            :color="cardColorList[index % 18]"
            elevation="0"
            class="pa-4"
            min-height="200px"
            @click="pushToDetail(item)"
          >
            <div class="text-h6">
              {{
                getProductNameByCode(item.product)
              }}
            </div>
            <div class="d-flex justify-center align-center mt-10">
              <div>
                正在使用:
              </div>
              <v-spacer />
              <div>
                {{ item.value['active'].length }}
              </div>
            </div>
            <div class="d-flex justify-center align-center">
              <div>
                正在试用:
              </div>
              <v-spacer />
              <div>
                {{ item.value['trialing'] ? item.value['trialing'].length : 0 }}
              </div>
            </div>
            <div class="d-flex justify-center align-center">
              <div>
                停止使用:
              </div>
              <v-spacer />
              <div>
                {{ item.value['cancel'] ? item.value['cancel'].length : 0 }}
              </div>
            </div>
          </v-card>
        </div>
      </div>
    </loading-provider>
  </div>
</template>
