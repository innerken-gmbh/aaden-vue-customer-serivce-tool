<script setup lang="ts">
const props = defineProps({
  info: {
    type: Object,
  },
})
</script>

<template>
  <v-card class="pa-4">
    <div class="d-flex text-h5">
      {{ info.name }}
    </div>
    <div class="d-flex text-body-1">
      {{ info.adress1 }}
      {{ info.adress2 }}
      {{ info.postCode }}
      {{ info.city }}
    </div>
    <div class="d-flex">
      Tel: {{ info.telephone }}
    </div>
    <div class="d-flex">
      Email: {{ info.emailAddress }}
    </div>
  </v-card>
</template>

<style scoped lang="scss">

</style>
