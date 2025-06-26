<!--
  - Copyright (c) 2022-2023. Haodong JU
  -->

<template>
  <div class="pa-1">
    <h3>选择日期范围</h3>
    <div class="mt-2">
      <div style="display: grid;grid-template-columns: repeat(2,1fr);grid-gap: 8px">
        <div>
          <v-dialog
            ref="dialog"
            v-model="startDateDialog"
            width="290px"
          >
            <template #activator="{props}">
              <div class="text-overline">
                起始日期
              </div>
              <v-text-field
                v-model="startDate"
                placeholder="From"
                hide-details
                outlined
                prepend-inner-icon="mdi-calendar"
                readonly
                v-bind="props"
              />
            </template>
            <v-date-picker
              v-model="startDate"
              :max="today()"
              @update:model-value="startDateDialog=false"
            />
          </v-dialog>
        </div>
        <div>
          <v-dialog
            ref="dialog"
            v-model="endDateDialog"
            width="290px"
          >
            <template #activator="{props}">
              <div class="text-overline">
                截止日期
              </div>
              <v-text-field
                v-model="endDate"
                placeholder="To"
                hide-details
                outlined
                prepend-inner-icon="mdi-calendar"
                readonly
                v-bind="props"
              />
            </template>
            <v-date-picker
              v-model="endDate"
              :max="today()"
              @update:model-value="endDateDialog=false"
            />
          </v-dialog>
        </div>
      </div>
    </div>

    <div
      class="mt-4"
      style="display: grid;grid-template-columns: repeat(3,minmax(0,1fr));grid-gap: 8px"
    >
      <small-base-card
        v-for="d in currentTimeList"
        :key="d.label"
        :active="currentDateMatch(d.dateRange())"
        :style="currentDateMatch(d.dateRange())?{color:'white'}:{}"
        class="d-block overflow-hidden"
        style="width: 100%;"
        @click="dateRange=d.dateRange()"
      >
        <div
          class="d-flex justify-center align-center"
          style="height: 100%"
        >
          <div class="text-body-1 text-truncate">
            {{ d.label }}
          </div>
        </div>
      </small-base-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {predefinedDateRangeList} from "@/views/BaseWidget/basic/dialog/DateRepository";
import {today} from "@/views/BaseWidget/basic/dialog/dateRepo";
import SmallBaseCard from "@/views/BaseWidget/basic/dialog/SmallBaseCard.vue";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [null, null]
  }
})

const emit = defineEmits(['update:modelValue'])

const startDate = ref(null)
const endDate = ref(null)
const startDateDialog = ref(null)
const endDateDialog = ref(null)
const predefinedTimeList = ref(predefinedDateRangeList)

const currentTimeList = computed(() => {
  const dayOfWeek = new Date().getDay()
  const dayOfMonth = new Date().getDate()
  const month = new Date().getMonth()
  let list = predefinedTimeList.value
  if (dayOfWeek === 1) {
    list = predefinedTimeList.value.filter(it => it.label !== '这周')
  }
  if (dayOfMonth === 1) {
    if (month === 0) {
      list = predefinedTimeList.value.filter(it => it.label !== '今年')
    }
    list = predefinedTimeList.value.filter(it => it.label !== '这个月')
  }
  return list
})

const dateRange = computed({
  get: () => [startDate.value ?? endDate.value ?? today(), endDate.value ?? startDate.value ?? today()],
  set: (val) => {
    if (val?.length === 2) {
      [startDate.value, endDate.value] = val
    }
  }
})

// Watch for changes in props.modelValue
watch(() => props.modelValue, (val) => {
  dateRange.value = val
}, { immediate: true })

// Watch for changes in startDate
watch(startDate, (val) => {
  if (val > endDate.value) {
    endDate.value = val
  }
})

// Watch for changes in endDate
watch(endDate, (val) => {
  if (val < startDate.value) {
    startDate.value = val
  }
})

// Watch for changes in dateRange
watch(dateRange, (val) => {
  emit('update:modelValue', val)
})

function currentDateMatch(dateRange) {
  return [startDate.value, endDate.value].join() === dateRange.join()
}
</script>

<style scoped>

</style>
