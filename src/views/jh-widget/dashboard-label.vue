<script setup>
defineProps(['color','loading'])
const emit=defineEmits(['click'])

</script>

<template>
  <v-sheet
    :color="color"
    class="pa-2 px-4"
    @click="emit('click')"
  >
    <template v-if="loading">
      <div>
        <div class="text-caption font-weight-light">
          <slot name="label" />
        </div>
        <div class="text-body-2 font-weight-black">
          正在加载中🚶‍.....
        </div>
      </div>
    </template>
    <template v-else>
      <div>
        <div class="text-caption font-weight-light">
          <slot name="label" />
        </div>
        <div class="text-body-2 font-weight-black">
          <slot name="default" />
        </div>
      </div>
    </template>
  </v-sheet>
</template>

<style scoped lang="scss">

</style>
