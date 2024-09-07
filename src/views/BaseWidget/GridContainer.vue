<template>
  <div
    style="display: grid;"
    :style="{
      gridTemplateColumns:smAndDown?'1fr':gridTemplate,
      gridGap: gridGap,
    }"
  >
    <slot />
  </div>
</template>

<script setup>

import {useDisplay} from "vuetify";

defineProps({
  gridTemplate: {default: 'repeat(auto-fill,minmax(196px,1fr))'},
  gridGap: {default: '24px'},
})
const {smAndDown} = useDisplay()

</script>

<style scoped>

</style>
