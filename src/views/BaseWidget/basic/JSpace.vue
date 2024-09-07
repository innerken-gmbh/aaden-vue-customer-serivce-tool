<script setup>
defineProps({
  horizontal: {
    type: Boolean,
    default: true
  },
  gap: {
    type: Number,
    default: 8
  },
})
</script>

<template>
  <div
      :style="{
    gridAutoFlow:horizontal?'column':'row',
    gridGap:gap+'px'
      }"
      style="
  display: grid;
  align-items: center;
  grid-auto-columns: max-content;
  grid-auto-rows: min-content;
"
  >
    <slot/>
  </div>
</template>

<style scoped>

</style>
