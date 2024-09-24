<script setup>
import {onMounted, ref} from 'vue'
import {useSubscriptionStore,getZHProductName,getDateProgressLinear,formatDate,allProductCodeList,formatPriceDisplay,showCurrentBillType} from "@/store/aaden/saasSubscription";
import IKUtils from "innerken-js-utils";
import DeviceDetailPage from "@/views/dashboard/DeviceDetailPage.vue";
import {useDeviceEchoLog} from "@/store/aaden/DeviceEcho";


const storeSub = useSubscriptionStore()

const headers = ref([
  {
    title: '客户编号',
    key: 'deviceId',
  },
  {
    title: '邮箱',
    key: 'customerEmail',
  },
  {title: '项目名称', key: 'productZHName'},
  {title: '项目进度', key: 'subLinear',},
  {title: '状态', key: 'status',},
  {
    title: '截止时间',
    key: 'subscriptionEndDate',
  },
  {title: '费用', key: 'priceInfo', align: 'end'},
  {title: '付款时间', key: 'createTimestamp', align: 'end'},
])
onMounted(async () => {
  const code = IKUtils.getQueryString('Code') ?? ''
  const status = IKUtils.getQueryString('Status') ?? ''
  if (code || status) {
    storeSub.selectedProductCode = code
    storeSub.status = status
    storeSub.search = true
  }
  await storeSub.getList()
})

async function closeFilter() {
  storeSub.search = false
  storeSub.clearFilterInfo()
  await storeSub.getList()
}

const deviceEchoLog = useDeviceEchoLog()

const currentDeviceId = ref('')

async function clickItem(e, row) {
  currentDeviceId.value = row.item.deviceId
  await deviceEchoLog.selectLogByDeviceId(row.item.deviceId)
}
</script>

<template>
  <div>
    <div
      class="text-body-2 d-flex align-center justify-center"
    >
      <v-select
        v-model="storeSub.selectedProductCode"
        label="产品类型"
        item-title="name"
        item-value="value"
        hide-details
        :items="allProductCodeList"
      />
      <v-text-field
        v-model="storeSub.deviceId"
        label="DeviceId"
        class="ml-2"
        clearable
        hide-details
      />
      <v-text-field
        v-model="storeSub.email"
        label="邮箱"
        class="ml-2"
        clearable
        hide-details
      />
      <v-text-field
        v-model="storeSub.openDate"
        label="开通时间"
        clearable
        class="ml-2"
        hide-details
      />
      <v-text-field
        v-model="storeSub.status"
        label="状态"
        clearable
        class="ml-2"
        hide-details
      />
      <v-btn
        elevation="0"
        size="large"
        class="ml-2"
        base-color="white"
        @click="closeFilter"
      >
        清空
      </v-btn>
      <v-btn
        elevation="0"
        size="large"
        class="ml-2"
        base-color="info"
        @click="storeSub.search = true"
      >
        确定
      </v-btn>
    </div>
    <v-data-table
      class="mt-2"
      :headers="headers"
      :items-per-page="50"
      :items="storeSub.allSubscriptionList"
      @click:row="clickItem"
    >
      <template #[`item.productZHName`]="{ item }">
        {{ getZHProductName(item.productCode) }}/{{ showCurrentBillType(item.billingCycle) }}
      </template>
      <template #[`item.subscriptionEndDate`]="{ item }">
        {{
          formatDate(item.subscriptionEndDate)
        }}
      </template>
      <template #[`item.createTimestamp`]="{ item }">
        {{
          formatDate(item.createTimestamp)
        }}
      </template>
      <template #[`item.priceInfo`]="{ item }">
        {{
          formatPriceDisplay(item.priceInfo)
        }}
      </template>
      <template #[`item.subLinear`]="{ item }">
        <v-progress-linear
          :model-value="getDateProgressLinear(item.subscriptionStartDate,item.subscriptionEndDate)"
          height="20"
          color="info"
          rounded
        >
          <template #default="{ value }">
            <strong>{{ Math.ceil(value) }}%</strong>
          </template>
        </v-progress-linear>
      </template>
    </v-data-table>
    <device-detail-page />
  </div>
</template>
