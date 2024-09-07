<script setup>

import {nextTick, onMounted, ref} from "vue";
import {emojis} from "@/views/BaseWidget/form/formItems/emojiPicker/emojis";
import LoadingProvider from "@/views/BaseWidget/basic/premade/LoadingProvider.vue";

const loading = ref(true)
const model = defineModel()
onMounted(() => {
  nextTick(() => {
    loading.value = false
    if (!model.value && props.required) {
      model.value = emojis[0]
    }
  })
})
const props = defineProps(['required'])


</script>

<template>
  <div
    class="flex-grow-0"
    style="width: 100%"
  >
    <loading-provider
      style="width: 100%"
      :loading="loading"
    >
      <div
        class="mb-4"
        style="display: grid;grid-template-columns: repeat(6,minmax(0,1fr));width: 100%;height: 300px;overflow-y: scroll"
      >
        <v-lazy
          v-for="c in emojis"
          :key="c"
          min-height="48"
        >
          <v-card
            :color="model===c?'green':''"
            class="pa-1"
            elevation="0"
            @click="model=c"
          >
            <v-responsive :aspect-ratio="1">
              <v-card
                color="grey-lighten-4"
                elevation="0"
                class="d-flex align-center justify-center text-body-1"
                height="100%"
                rounded
                width="100%"
              >
                {{ c }}
              </v-card>
            </v-responsive>
          </v-card>
        </v-lazy>
      </div>
    </loading-provider>
  </div>
</template>

<style scoped>

</style>
