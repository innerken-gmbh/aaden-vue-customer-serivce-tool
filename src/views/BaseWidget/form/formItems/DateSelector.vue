<!--
  - Copyright (c) 2024. Haodong JU
  -->

<template>
  <div class="flex-grow-1">
    <v-text-field
      v-model="model"
      :dense="dense"
      outlined
      append-inner-icon="mdi-calendar"
      readonly
      :rules="rules"
      @click="dialog=true"
    />
    <v-dialog
      v-model="dialog"
      width="290px"
    >
      <v-date-picker
        v-model="internalValue"
        :min="min"
        @update:model-value="dialog=false"
      />
    </v-dialog>
  </div>
</template>

<script setup>
import dayjs from "dayjs";
import {ref, watch} from "vue";

const dialog = ref(false)
const model = defineModel()
const internalValue = ref(null)
defineProps({
  rules: {},
  dense: {},
  min: {}
})
watch(internalValue, () => {
  if (internalValue.value) {
    model.value = dayjs(internalValue.value).format('YYYY-MM-DD')
  } else {
    model.value = ''
  }

})

</script>

<style scoped>

</style>
