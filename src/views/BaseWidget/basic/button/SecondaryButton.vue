<script setup>

import OutlineBaseContainer from "@/views/BaseWidget/basic/OutlineBaseContainer.vue";

defineProps(['icon', 'block'])
const emit = defineEmits(['click'])
</script>

<template>
  <outline-base-container
    class="text-no-wrap"
    :width="block?'100%':''"
    :icon="icon"
    @click="emit('click')"
  >
    <slot />
  </outline-base-container>
</template>

<style scoped>

</style>
