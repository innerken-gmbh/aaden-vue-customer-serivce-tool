<script setup>

import BaseIconButton from "@/views/BaseWidget/basic/button/BaseIconButton.vue";

const model = defineModel()
const props = defineProps({
  trueIcon: {
    default: 'mdi-unfold-less-horizontal'
  },
  falseIcon: {
    default: ' mdi-unfold-more-horizontal'
  },
  small: {}
})

</script>

<template>
  <base-icon-button
    :small-icon="true"
    @click="model=!model"
  >
    <template v-if="model">
      {{ trueIcon }}
    </template>
    <template v-else>
      {{ falseIcon }}
    </template>
  </base-icon-button>
</template>

<style scoped>

</style>
