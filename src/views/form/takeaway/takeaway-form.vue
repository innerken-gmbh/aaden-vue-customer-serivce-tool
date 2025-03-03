<script setup lang="ts">
import {takeawayStore} from "@/store/aaden/takeawayStore";
import {ref} from "vue";
import {fromNowTimeDisplay, fromNowTimestamp} from '@/store/aaden/DeviceEcho'
import CloudOrderDetail from "@/views/form/takeaway/cloudOrderDetail.vue";

const store = takeawayStore()
const detailDialog = ref(false)
const header = ref([
  {
    title: '订单id',
    key: 'id',
  },
  {
    title: '创建时间',
    key: 'createdAt',
  },
  {
    title: '总价',
    key: 'totalPrice',
  },
  {
    title: '详情',
    key: 'detail',
  },
])
const orderInfo = ref({})

async function showDetail(item) {
  console.log(item,'item')
  orderInfo.value = item
  await store.getPayMethodList()
  detailDialog.value = true

}

</script>

<template>
  <div class="main-container">
    <v-card class="mt-4">
      <div
        class="text-body-2 d-flex align-center justify-center pa-2"
      >
        <v-text-field
          v-model="store.search"
          clearable
          class="mx-2"
          hide-details
          label="DeviceId"
          prepend-inner-icon="mdi-magnify"
        />
        <v-btn
          variant="outlined"
          size="large"
          @click="store.getCloudList()"
        >
          查询
        </v-btn>
      </div>
      <v-data-table
        class="pa-4"
        :headers="header"
        :items="store.cloudList"
      >
        <template #[`item.createdAt`]="{ item }">
          <v-tooltip bottom>
            <template #activator="{props }">
              <div v-bind="props">
                {{ fromNowTimestamp(item.createdAt) }}
              </div>
            </template>
            <span>{{ fromNowTimeDisplay(item.createdAt) }}</span>
          </v-tooltip>
        </template>
        <template #[`item.detail`]="{ item }">
          <v-btn
            variant="outlined"
            @click="showDetail(item)"
          >
            详情
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
    <v-dialog
      v-model="detailDialog"
      max-width="800px"
    >
      <v-card>
        <cloud-order-detail
          :pay-method-list="store.payMethodList"
          :info="orderInfo"
          @close="detailDialog = false"
        />
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">

</style>
