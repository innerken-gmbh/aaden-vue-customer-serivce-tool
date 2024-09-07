<script setup>
defineProps({
  smallIcon: {
    default: false
  }
})
const emit = defineEmits(['click'])
</script>

<template>
  <v-btn
    size="small"
    density="compact"
    icon
    elevation="0"
    @click.stop="emit('click')"
  >
    <v-icon :small="smallIcon">
      <slot />
    </v-icon>
  </v-btn>
</template>

<style scoped>

</style>
