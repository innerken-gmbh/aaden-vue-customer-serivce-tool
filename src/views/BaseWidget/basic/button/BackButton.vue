<template>
  <v-btn
    elevation="0"
    class=" mr-2 rounded-xl"
    icon
    @click="emit('click')"
  >
    <v-icon size="24">
      <slot>
        mdi-arrow-left
      </slot>
    </v-icon>
  </v-btn>
</template>

<script setup>
const emit = defineEmits(['click'])

</script>

<style scoped>

</style>
