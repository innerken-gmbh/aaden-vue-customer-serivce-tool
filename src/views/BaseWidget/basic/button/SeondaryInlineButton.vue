<!--
  - Copyright (c) 2024. Haodong JU
  -->

<template>
  <v-btn
    variant="tonal"
    height="42"
    class="pa-3 rounded-lg"
    :block="full"
    :loading="loading"
    :disabled="disabled"
    elevation="0"
    :prepend-icon="icon"
    color="grey-darken-2"
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
    default: ''
  }
})
</script>

<style scoped>

</style>
