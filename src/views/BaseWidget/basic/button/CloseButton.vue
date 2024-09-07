<script setup>

import OutlineBaseContainer from "@/views/BaseWidget/basic/OutlineBaseContainer.vue";
const emit = defineEmits(['click'])

</script>

<template>
  <outline-base-container
    width="fit-content"
    class="mb-4 text-no-wrap"
    @click="emit('click')"
  >
    <v-icon left>
      mdi-close
    </v-icon>
    {{ $t('Close') }}
  </outline-base-container>
</template>

<style scoped>

</style>
