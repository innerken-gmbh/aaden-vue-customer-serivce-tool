<!--
  - Copyright (c) 2024. Haodong JU
  -->

<template>
  <v-select
    v-model="model"
    :menu-props="{offsetY:true}"
    :item-value="'start'"
    item-title="start"
    :items="timeArrays"
    :dense="dense"
    :hide-details="hideDetails"
    :label="label"
    :rules="rules"
    outlined
  />
</template>

<script setup>

const timeArrays = new Array(48).fill(['', '']).map((item, index) => {
  const startVal = index * 30
  const startHour = Math.floor((startVal / 60))
  const startMinute = (startVal % 60)
  const startTime = ((startHour < 10) ? ('0' + startHour) : startHour) + ':' + (startMinute === 0 ? '00' : startMinute)
  return {
    start: startTime
  }
})

timeArrays.push({start: '23:59'})
const props = defineProps({
  dense: {},
  hideDetails: {},
  label: {},
  rules: {
    type: Array,
    default: () => []
  }
})
const model = defineModel()

</script>

<style scoped>

</style>
