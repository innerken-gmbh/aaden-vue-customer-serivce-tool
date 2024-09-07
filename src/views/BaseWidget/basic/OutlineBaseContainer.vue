<script setup>
defineProps({
  width: {
    default: () => '100%'
  },
  icon: {type: String, default: ''},
})
const emit = defineEmits(['click'])
</script>

<template>
  <v-btn
    height="42"
    color="grey-darken-2"
    variant="tonal"
    :prepend-icon="icon"
    :width="width"
    class="text-body-2
         py-2 px-3 d-flex align-center justify-center rounded-lg"
    @click="emit('click')"
  >
    <slot />
  </v-btn>
</template>

<style scoped>

</style>
