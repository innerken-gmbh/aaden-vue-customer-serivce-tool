<script setup lang="ts">
import {computed} from "vue";
import {priceDisplay} from '@/store/aaden/utils'
import {keys} from "lodash-es";

const props = defineProps({
  info: {
    type: Object,
  },
  payMethodList: {
    type: Array,
  }
})
const orderInfo = computed(() => {
  const res = props.info.detailInfo.order
  return res.map(it => {
    it.modInfoValue = it.displayApply
        .map((x) => {
          const price = x.priceInfo > 0 ? ' (' + x.priceInfo + ')' : ''
          return x.value + price
        }).join(', ')
    return it
  })
})
const takeawayWebInfo = computed(() => {
  return keys(props.info.detailInfo.addressInfo.metaData).filter(it => it !== 'paid')
})
const addressInfo = computed(() => {
  return props.info.detailInfo.addressInfo
})
const takeawayMetaData = computed(() => {
  return props.info.detailInfo.addressInfo?.metaData
})
function showCurrentPayMethod (id) {
  return props.payMethodList.find(it => it.id === id).name
}
</script>

<template>
  <v-container
    style="height: 100vh;overflow-y: scroll"
  >
    <div
      class="d-flex flex-wrap align-center"
    >
      <div class="d-flex align-center">
        <v-btn
          icon
          variant="outlined"
          @click="$emit('close')"
        >
          <v-icon size="24">
            mdi-arrow-left
          </v-icon>
        </v-btn>
        <div class="py-5 pb-6 text-h4 ml-4">
          #{{ info.id }}
        </div>
      </div>
    </div>
    <div class="d-flex">
      <div
        class="flex-grow-1"
        style="width: 100%"
      >
        <v-card
          v-for="(item,index) in orderInfo"
          :key="index"
          class="pa-4 mt-2"
          elevation="0"
          variant="outlined"
          width="100%"
        >
          <div class="d-flex">
            <div class="font-weight-bold text-body-1">
              {{ item.code }}
            </div>
            <div class="d-flex flex-column ml-4">
              <div class="text-body-1 font-weight-bold ">
                {{ item.name }}
              </div>
              <div>
                {{ item.modInfoValue }}
              </div>
            </div>
            <v-spacer />
            <div class="d-flex flex-column text-no-wrap text-right text-body-1">
              <div>* {{ item.count }}</div>
              <div>{{ priceDisplay(item.realPrice) }}</div>
            </div>
          </div>
        </v-card>
      </div>
      <v-spacer />
      <div
        class="d-flex flex-column ml-4"
      >
        <v-card
          class="py-4 mt-2"
          elevation="0"
          variant="outlined"
        >
          <div class="text-body-1 font-weight-bold px-4">
            基本信息
          </div>
          <v-divider class="my-2" />
          <div class="px-4">
            <div class="d-flex align-center justify-center">
              <div class="text-caption font-weight-bold">
                接收状态:
              </div>
              <v-spacer />
              <v-icon>
                {{ info.processed ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
            </div>
            <div class="d-flex align-center justify-center">
              <div class="text-caption font-weight-bold">
                支付状态:
              </div>
              <v-spacer />
              <v-icon>
                {{ info.paymentStatus === 1 ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
            </div>
            <div class="d-flex align-center justify-center">
              <div class="text-caption font-weight-bold">
                支付方式:
              </div>
              <v-spacer />
              <div class="text-caption font-weight-bold">
                {{ showCurrentPayMethod(addressInfo?.payMethodId) }}
              </div>
            </div>
            <div class="d-flex">
              <div class="text-caption font-weight-bold">
                总支付:
              </div>
              <v-spacer />
              <div class="text-caption font-weight-bold">
                {{ priceDisplay(info.totalPrice) }}
              </div>
            </div>
            <div
              v-for="(item,index) in takeawayWebInfo"
              :key="index"
            >
              <div class="d-flex">
                <div class="text-caption font-weight-bold">
                  {{ item }}:
                </div>
                <v-spacer />
                <div class="text-caption font-weight-bold">
                  {{ takeawayMetaData[item] }}
                </div>
              </div>
            </div>
          </div>
        </v-card>
        <v-card
          variant="outlined"
          class="mt-4"
          elevation="0"
        >
          <v-card-text>
            <div class="text-h6">
              {{ addressInfo.lastName.trim() }} {{ addressInfo.firstName.trim() }}
            </div>
            <p class="mt-2">
              {{ addressInfo.addressLine1 }}
              <template v-if="addressInfo.addressLine2">
                {{ addressInfo.addressLine2 }}<br>
              </template>

              {{ addressInfo.city }} {{ addressInfo.plz }}<br>
              <span class="font-weight-bold">邮箱: </span>{{ addressInfo.email }}<br>
              <span class="font-weight-bold">电话: </span>{{ addressInfo.tel }}<br>
              <span class="font-weight-bold">交货时间: </span>{{ addressInfo.date }} {{ addressInfo.time }}<br>
              {{ addressInfo.note }}
            </p>
            <v-chip v-if="addressInfo.deliveryMethod">
              {{ addressInfo.deliveryMethod }}
            </v-chip>
            <v-chip v-if="addressInfo.reason">
              {{ addressInfo.reason }}
            </v-chip>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </v-container>
</template>

<style scoped lang="scss">

</style>
