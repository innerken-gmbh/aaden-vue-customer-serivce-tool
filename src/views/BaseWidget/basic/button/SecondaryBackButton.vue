<script setup>

import OutlineBaseContainer from "@/views/BaseWidget/basic/OutlineBaseContainer.vue";
</script>

<template>
  <outline-base-container
    width="fit-content"
    @click="$router.back()"
  >
    <v-icon left>
      mdi-arrow-left
    </v-icon>
    {{ $t('PrimaryBtnInventoryReturn') }}
  </outline-base-container>
</template>

<style scoped>

</style>

