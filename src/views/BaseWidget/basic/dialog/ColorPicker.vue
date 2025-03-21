<script setup>

import {nextTick, onMounted} from "vue";

const model = defineModel()
const colorList = ['#FFCDD2', '#F8BBD0', '#E1BEE7',
  '#D1C4E9', '#C5CAE9', '#BBDEFB',
  '#B3E5FC', '#B2EBF2', '#B2DFDB',
  '#C8E6C9', '#DCEDC8', '#F0F4C3',
  '#FFF9C4', '#FFECB3', '#FFE0B2',
  '#FFCCBC', '#D7CCC8', '#CFD8DC']

const props = defineProps(['required'])


onMounted(() => {
  nextTick(() => {
    if (!model.value && props.required) {
      model.value = colorList[0]
    }
  })
})
</script>

<template>
  <div
    class="mb-4"
    style="display: grid;grid-template-columns: repeat(6,minmax(0,1fr));width: 300px"
  >
    <v-card
      v-for="c in colorList"
      :key="c"
      :color="model===c?'success':''"
      class="pa-1"
      elevation="0"
      @click="model=c"
    >
      <v-responsive :aspect-ratio="1">
        <v-card
          :color="c"
          elevation="0"
          height="100%"
          rounded
          width="100%"
        />
      </v-responsive>
    </v-card>
  </div>
</template>

<style scoped>

</style>
