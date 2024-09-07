<!--
  - Copyright (c) 2022-2024. Haodong JU
  -->
<script setup>
import BackButton from "@/views/BaseWidget/basic/button/BackButton.vue";
import SecondaryBackButton from "@/views/BaseWidget/basic/button/SecondaryBackButton.vue";
import {useDisplay} from "vuetify";

defineProps(['useBack'])
const {smAndDown} = useDisplay()
const emit = defineEmits(['back'])
</script>
<template>
  <div>
    <div
      v-if="!smAndDown"
      class="d-flex align-center mb-4"
    >
      <back-button
        v-if="useBack"
        @click="emit('back')"
      />
      <slot name="icon" />
      <div class="mr-2">
        <span class="text-h6 font-weight-bold"><slot /></span>
        <div class="text-body-2">
          <slot name="subtitle" />
        </div>
      </div>
      <v-spacer />
      <slot name="action" />
    </div>
    <div v-else>
      <div
        v-if="useBack"
        class="d-flex align-center"
      >
        <secondary-back-button
          v-if="useBack"
          @click="emit('back')"
        />
        <v-spacer />
        <slot name="action" />
      </div>
      <div class="mb-4 mt-4 d-flex">
        <div>
          <span class="text-body-1 font-weight-bold"><slot /></span>
          <div class="text-caption">
            <slot name="subtitle" />
          </div>
        </div>
        <v-spacer />
        <slot
          v-if="!useBack"
          name="action"
        />
      </div>
    </div>
  </div>
</template>


<style scoped>

</style>
