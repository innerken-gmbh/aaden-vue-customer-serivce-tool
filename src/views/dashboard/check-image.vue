<script setup>
import {computed, onMounted, ref, watch} from 'vue'
import {getDishImages, getDishList} from "@/store/aaden/cloud-v2-api";
import LoadingProvider from "@/views/BaseWidget/basic/premade/LoadingProvider.vue";
import {groupBy} from "lodash-es";
import JSZip from 'jszip'
import FileSaver from 'file-saver'
import {generateCorsUrl} from "@/store/aaden/utils";


onMounted(async () => {
  await reload()
})
let allImgList = ref([])
let searchDeviceId = ref('')
let currentList = ref([])
let loading = ref(false)
let editMode = ref(false)
let selectedImgList = ref([])
let loadingDialog = ref(false)

async function reload() {
  loading.value = true
  allImgList.value = await getDishImages()
  currentList.value = allImgList.value
  loading.value = false
}

function selectedItem (value,item) {

  if (value === '1') {
    selectedImgList.value.push(item)
  } else {
    selectedImgList.value = selectedImgList.value.filter(it => it.imagePath !== item.imagePath)
  }
}

function selectedAll () {
  selectedImgList.value = currentList.value
}

function changeMode (value) {
  if (value === '1') {
    editMode.value = true
  } else {
    editMode.value = false
    selectedImgList.value = []
  }
}

function alreadySelected (value) {
  return selectedImgList.value.find(it => it.imagePath === value.imagePath)
}

async function downloadImg () {
  loadingDialog.value = true
  const res = groupBy(selectedImgList.value,'deviceId')
  for (const item in res) {
    const dishList = await getDishList(item)
    const currentList = res[item].map(it => {
      const fileType = it.imagePath.slice(it.imagePath.lastIndexOf('.'))
      return {url: it.imagePath,name: dishList.find(a => a.dishId.toString() === it.dishesId.toString()).code,type: fileType}
    })
    const zip = new JSZip()
    const img = zip.folder('images')
    for (const dishes of currentList) {
      img.file(`${dishes.name + dishes.type}`, (await fetch(generateCorsUrl(dishes.url))).blob())
    }
    zip.generateAsync({ type: 'blob' })
        .then(function (content) {
          FileSaver.saveAs(content, 'DeviceId' + item + '.zip')
        })
  }
  loadingDialog.value = false
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
        class="d-flex align-center justify-center"
      >
        <v-btn
          v-if="!editMode"
          color="info"
          class="ml-2"
          variant="outlined"
          @click="changeMode('1')"
        >
          编辑
        </v-btn>
        <div v-else>
          <v-btn
            color="red"
            class="ml-2"
            variant="outlined"
            @click="changeMode('0')"
          >
            取消
          </v-btn>
          <v-btn
            color="info"
            variant="outlined"
            class="ml-2"
            @click="selectedAll"
          >
            全选
          </v-btn>
          <v-btn
            color="info"
            variant="outlined"
            class="ml-2"
            @click="downloadImg"
          >
            下载
          </v-btn>
        </div>

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
            elevation="0"
            class="d-flex flex-column pa-2"
          >
            <div
              v-if="editMode"
              class="d-flex"
            >
              <div />
              <v-spacer />
              <v-icon
                v-if="alreadySelected(img)"
                color="green"
                @click="selectedItem('0',img)"
              >
                mdi-check-circle-outline
              </v-icon>
              <v-icon
                v-else
                @click="selectedItem('1',img)"
              >
                mdi-checkbox-blank-circle-outline
              </v-icon>
            </div>
            <v-img
              aspect-ratio="1"
              :width="300"
              :src="img.imagePath"
            />
            <div class="d-flex align-center justify-center flex-column">
              <div>DeviceId: {{ img.deviceId }}</div>
              <div>DishId: {{ img.dishesId }}</div>
            </div>
          </v-card>
        </div>
      </div>
    </loading-provider>
    <v-dialog
      v-model="loadingDialog"
      max-width="600px"
    >
      <v-card>
        <v-responsive :aspect-ratio="3/2">
          <div
            class="d-flex align-center justify-center  flex-column"
            style="height: 100%"
          >
            <v-progress-circular indeterminate />
            <div class="mt-12">
              我知道你很急,但是你先别急！！！！
            </div>
          </div>
        </v-responsive>
      </v-card>
    </v-dialog>
  </div>
</template>
