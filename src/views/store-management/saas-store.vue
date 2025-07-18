<template>
  <div class="main-container">
    <div
      class="text-body-2 d-flex align-center justify-center pa-2"
    >
      <v-text-field
        v-model="search"
        clearable
        class="mx-2"
        hide-details
        label="DeviceId"
        prepend-inner-icon="mdi-magnify"
      />
    </div>
    <v-data-table
      class="pa-4"
      :search="search"
      :headers="header"
      :items="store.storeList"
    >
      <template #[`item.detail`]="{ item }">
        <v-btn
          variant="outlined"
          @click="showDetail(item)"
        >
          详情
        </v-btn>
      </template>
      <template #[`item.deleteStore`]="{ item }">
        <v-btn
          variant="outlined"
          @click="storeDelete(item)"
        >
          删除
        </v-btn>
      </template>
    </v-data-table>
    <v-dialog
      v-model="storeInfoDialog"
      max-width="800px"
    >
      <store-detail-page :info="store.detailInfo" />
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>

import {saasStore} from "@/store/aaden/saasStore";
import {onMounted, ref} from "vue";
import CloudOrderDetail from "@/views/form/takeaway/cloudOrderDetail.vue";
import StoreDetailPage from "@/views/store-management/storeDetailPage.vue";

const store = saasStore()
const search = ref('')
const header = ref([
  {
    title: 'deviceId',
    key: 'deviceId',
  },
  {
    title: 'Status',
    key: 'currentStatus',
  },
  {
    title: 'baseUrl',
    key: 'baseUrl',
  },
  {
    title: 'Mode',
    key: 'testModeStatus',
  },
  {
    title: 'Create Time',
    key: 'createdAt',
  },
  {
    title: 'Detail',
    key: 'detail',
  },
  {
    title: "Delete",
    key: "deleteStore",
  }
])
const storeInfoDialog = ref(false)

onMounted(() => {
  store.getStoreList()
})

async function showDetail(item) {
  await store.getStoreDetail(item.deviceId)
  storeInfoDialog.value = true
}
async function storeDelete (item) {
  await store.deleteStore(item.id)
  await store.getStoreList()
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
