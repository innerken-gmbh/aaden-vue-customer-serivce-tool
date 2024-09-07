<!--
  - Copyright (c) 2024. Haodong JU
  -->

<template>
  <div
    class="mb-4 flex-grow-1"
  >
    <v-card
      class="d-flex justify-center align-center"
      color="#eeeeee"
      flat
      width="100%"
      :min-height="size"

      @click="startUpload"
    >
      <img-with-loading
        v-if="fileStore"
        :img-src="uploadUrl"
      />
      <template
        v-else-if="currentUrl"
      >
        <img-with-loading
          :img-src="currentUrl"
        />
      </template>
      <template v-else>
        <div class="d-flex flex-column text-grey justify-center align-center">
          <v-icon icon="mdi-upload" />
          <div class="text-body-2 font-weight-medium ">
            {{ $t('ClickToUploadImages') }}
          </div>
        </div>
      </template>
    </v-card>
    <div style="width: 12px;position: absolute">
      <v-file-input
        ref="file"
        v-model="fileStore"
        :rules="rules"
        accpet="image/*"
        style="height: 0;opacity: 0"
      />
    </div>
  </div>
</template>

<script setup>


import ImgWithLoading from "@/views/BaseWidget/form/formItems/ImageUpload/ImgWithLoading.vue";
import {computed, ref, watch} from "vue";

const model = defineModel()
defineProps({
  rules: {},
  currentUrl: {}
})
const fileStore = ref(null)
const size = ref(96)
const file = ref(null)
const uploadUrl = computed(() => {
  return URL.createObjectURL(fileStore.value)
})
watch(fileStore, () => {
  model.value = fileStore.value
})

function startUpload() {
  console.log(file.value.click())
}


</script>

<style scoped>

</style>
