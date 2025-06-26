<!--
  - Copyright (c) 2023. Haodong JU
  -->

<template>
  <v-dialog
    v-model="timePickerDialog"
    max-width="400px"
  >
    <template #activator="{props}">
      <v-card
        :class="'pa-3 '+cardClass"
        :color="color"
        class="d-flex align-center px-4 overflow-hidden"
        elevation="0"
        v-bind="props"
      >
        <v-icon class="mr-2 mt-1">
          mdi-calendar-sync-outline
        </v-icon>
        <v-spacer />
        <div class="text-truncate">
          {{ formatDate(realValue) }}
        </div>
      </v-card>
    </template>
    <v-card
      class="pa-6"
      color="#f6f6f6"
    >
      <date-range-picker v-model="realValue" />
      <v-btn
        block
        class="mt-2"
        color="amber lighten-4 black--text"
        elevation="0"
        rounded
        x-large
        @click="confirmDate"
      >
        确定
        <v-icon
          right
        >
          mdi-check
        </v-icon>
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import DateRangePicker from '@/views/BaseWidget/basic/dialog/DateRangePicker.vue'
import {today} from "@/views/BaseWidget/basic/dialog/dateRepo";

const props = defineProps({
  color: {},
  modelValue: {},
  cardClass: {},
  showDateFields: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const timePickerDialog = ref(false)
const realValue = ref([today(), today()])

// Format date for display
const formatDate = (date) => {
  if (Array.isArray(date) && date.length === 2) {
    return `${date[0]} - ${date[1]}`
  }
  return date || ''
}

// Watch for changes in props.modelValue
watch(() => props.modelValue, (val) => {
  if (val) {
    realValue.value = val
  }
}, { immediate: true })

function confirmDate() {
  emit('update:modelValue', realValue.value)
  timePickerDialog.value = false
}
</script>

<style scoped>
</style>
