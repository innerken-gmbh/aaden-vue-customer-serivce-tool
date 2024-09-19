<script setup>
import {onMounted, ref, watch} from 'vue'
import {getDishImages} from "@/store/aaden/cloud-v2-api";
import LoadingProvider from "@/views/BaseWidget/basic/premade/LoadingProvider.vue";


onMounted(async () => {
  await reload()
})
let allImgList = ref([])
let searchDeviceId = ref('')
let currentList = ref([])
let loading = ref(false)

async function reload() {
  loading.value = true
  allImgList.value = await getDishImages()
  currentList.value = allImgList.value
  loading.value = false
}


watch((searchDeviceId),async (value) => {
  if (value) {
    currentList.value = allImgList.value.filter(it => it.deviceId === value)
  } else {
    currentList.value = allImgList.value
  }
},{
  deep: true,
  immediate: true,
})

</script>

<template>
  <div>
    <loading-provider :loading="loading">
      <div
        class="d-flex mt-2"
      >
        <div />
        <v-spacer />
        <v-text-field
          v-model="searchDeviceId"
          hide-details
          label="DeviceId"
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          style="max-width: 300px"
        />
      </div>

      <div
        style="display: grid;grid-template-columns: repeat(8,minmax(0,1fr))"
      >
        <div
          v-for="(img,index) in currentList"
          :key="index"
          class="pa-2"
        >
          <v-card
            out-lined
            elevation="0"
            class="d-flex align-center justify-center flex-column"
          >
            <v-img
              aspect-ratio="1"
              :width="300"
              :src="img.imagePath"
            />
            <div>DeviceId: {{ img.deviceId }}</div>
            <div>DishId: {{ img.dishesId }}</div>
          </v-card>
        </div>
      </div>
    </loading-provider>
  </div>
</template>
