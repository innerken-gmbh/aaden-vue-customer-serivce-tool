<script setup>
defineProps(['color'])

</script>

<template>
  <v-sheet
    :color="color"
    class="pa-2 px-4"
  >
    <div>
      <div class="text-caption font-weight-light">
        <slot name="label" />
      </div>
      <div class="text-body-2 font-weight-black">
        <slot name="default" />
      </div>
    </div>
  </v-sheet>
</template>

<style scoped lang="scss">

</style>
