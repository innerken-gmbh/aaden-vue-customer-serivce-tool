<!--
  - Copyright (c) 2023. Haodong JU
  -->

<template>
  <div>
    <slot
      v-if="!loading&&!empty"
    />
    <template v-else>
      <v-responsive :aspect-ratio="3/2">
        <div
          class="d-flex align-center justify-center  flex-column"
          style="height: 100%"
        >
          <template v-if="loading">
            <v-progress-circular indeterminate />
            <div class="mt-12">
              <slot name="loadingText" />
            </div>
          </template>
          <template v-else>
            <div>
              <v-img
                height="48"
                :src="box"
                width="48"
              />
            </div>
            <div class="mt-4 text-body-2">
              {{ $t('CurrentlyNoAvailableData') }}
            </div>
          </template>
        </div>
      </v-responsive>
    </template>
  </div>
</template>

<script setup>
import box from '@/assets/box.png'

defineProps({
  loading: {
    type: Boolean,
    required: true,
  },
  empty: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>

</style>
