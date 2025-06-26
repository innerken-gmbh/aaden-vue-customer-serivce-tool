<!--
  - Copyright (c) 2022-2023. Haodong JU
  -->

<template>
  <v-card
    :color="active?'amber lighten-4 black--text':'white'"
    class="pa-4"
    elevation="0"
    @click="$emit('click')"
  >
    <slot />
  </v-card>
</template>

<script>
export default {
  name: 'SmallBaseCard',
  props: {
    active: { type: Boolean },
    clickable: {
      default: true,
      type: Boolean
    }

  }
}
</script>

<style scoped>

</style>
