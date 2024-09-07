<!--
  - Copyright (c) 2024. Haodong JU
  -->

<template>
  <v-btn
    height="42"
    class="pa-3 rounded-lg"
    :block="full"
    :loading="loading"
    :disabled="disabled"
    :prepend-icon="icon"
    elevation="0"
    :color="disabled?'':'black'"
    @click="emit('click')"
  >
    {{ text }}
  </v-btn>
</template>

<script setup>
const emit = defineEmits(['click'])

defineProps({
  full: {},
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: 'OK'
  },
  icon: {
    type: String,
    default: 'mdi-check'
  },
})
</script>

<style scoped>

</style>
