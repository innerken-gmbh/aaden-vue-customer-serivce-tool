<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import {useSubscriptionStore,getZHProductName,getDateProgressLinear,formatDate,allProductCodeList,formatPriceDisplay,showCurrentBillType} from "@/store/aaden/saasSubscription";
import IKUtils from "innerken-js-utils";


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
  {
    title: '截止时间',
    key: 'subscriptionEndDate',
  },
  {title: '费用', key: 'priceInfo', align: 'end'},
  {title: '付款时间', key: 'createTimestamp', align: 'end'},
])
onMounted(async () => {
  const res = IKUtils.getQueryString('Code')
  if (res) {
    storeSub.selectedProductCode = res
    storeSub.search = true
  }
  await storeSub.getList()
})

async function closeFilter() {
  showSearchDialog.value = false
  storeSub.search = false
  storeSub.clearFilterInfo()
  await storeSub.getList()
}

const showSearchDialog = ref(false)
</script>

<template>
  <div>
    <div
      class="text-body-2 d-flex"
    >
      <v-card
        v-if="storeSub.search"
        variant="outlined"
        class="d-flex align-center justify-center px-4"
      >
        {{ storeSub.allFilterInfo }}
        <v-spacer />
        <v-icon @click="closeFilter">
          mdi-close
        </v-icon>
      </v-card>
      <v-spacer />
      <v-btn
        elevation="0"
        base-color="white"
        icon
        @click="showSearchDialog = true"
      >
        <v-icon>mdi-tools</v-icon>
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
    <v-dialog
      v-model="showSearchDialog"
      max-width="600px"
    >
      <v-card
        rounded
        class="pa-4"
      >
        <div class="d-flex align-center justify-center">
          <div class="text-h5">
            过滤
          </div>
          <v-spacer />
          <div>
            <v-icon
              size="large"
              @click="closeFilter"
            >
              mdi-close
            </v-icon>
          </div>
        </div>
        <div class="mt-4">
          <div class="d-flex align-center justify-center">
            <div>产品类型:</div>
            <v-spacer />
            <v-select
              v-model="storeSub.selectedProductCode"
              item-title="name"
              item-value="value"
              hide-details
              :items="allProductCodeList"
            />
          </div>
        </div>
        <div class="mt-4">
          <div class="d-flex align-center justify-center">
            <div>设备Id:</div>
            <v-spacer />
            <v-text-field
              v-model="storeSub.deviceId"
              max-width="268px"
              clearable
              hide-details
            />
          </div>
        </div>
        <div class="mt-4">
          <div class="d-flex align-center justify-center">
            <div>邮箱:</div>
            <v-spacer />
            <v-text-field
              v-model="storeSub.email"
              max-width="268px"
              clearable
              hide-details
            />
          </div>
        </div>
        <div class="mt-4">
          <div class="d-flex align-center justify-center">
            <div class="d-flex flex-column">
              <div>
                开通时间:
              </div>
              <span class="text-caption">例如: YYYY-MM-DD</span>
            </div>
            <v-spacer />
            <v-text-field
              v-model="storeSub.openDate"
              max-width="268px"
              clearable
              hide-details
            />
          </div>
        </div>
        <div class="mt-8">
          <v-btn
            variant="outlined"
            color="info"
            elevation="0"
            width="100%"
            @click="storeSub.search = true;showSearchDialog = false"
          >
            确定
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>
