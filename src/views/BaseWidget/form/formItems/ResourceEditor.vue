<script setup>
import {computed, nextTick, onMounted, ref, watchEffect} from "vue";
import IKUtils from "innerken-js-utils";
import {getResourceList} from "@/js/api/api-v2";

let counter = 0

const defaultUnitInfo = {resourceId: '', amount: '', unitId: ''}
const props = defineProps(['modelValue', 'dense', 'required', 'outlined', 'rules'])
const unitArray = ref([])
const resources = ref([])


watchEffect(() => {
  fillIfEmtpy()
})
const result = computed(() => {
  return unitArray.value.filter(it => it.resourceId && it.amount)
})

function fillIfEmtpy() {
  const empty = unitArray.value.filter(it => !it.resourceId && !it.amount)
  if (empty.length === 0) {
    unitArray.value.push(createRow())
  } else if (empty.length > 1) {
    unitArray.value = unitArray.value.filter(it => it.resourceId || it.amount)
    unitArray.value.push(createRow())
  }
}

function deleteRow(row) {
  row.resourceId = null
  row.amount = null
  row.unitId = null
  fillIfEmtpy()
}

function createRow() {
  const row = IKUtils.deepCopy(defaultUnitInfo)
  row.key = counter++
  return row
}

const emit = defineEmits(['update:modelValue'])
onMounted(async () => {
  resources.value = await getResourceList()
  nextTick(() => {
    if (props.modelValue?.length > 0) {
      unitArray.value = props.modelValue
    }
    watchEffect(() => {
      emit('update:modelValue', result.value)
    })

  })
})

</script>

<template>
  <div style="width: 100%">
    <div
      v-for="(r,index) in unitArray"
      :key="r.key"
      class="mb-4"
    >
      <v-select
        v-model="r.resourceId"
        :items="resources"
        item-title="name"
        item-value="id"
        :label="$t('RequiredRawMaterials')"
        hide-details
        :outlined="outlined"
        :placeholder="$t('RawMaterials')"
        @blur="fillIfEmtpy"
      />
      <div
        v-if="r.resourceId"
        class="d-flex mt-2"
      >
        <v-select
          v-model="r.unitId"
          :items="resources.find(it=>it.id===r.resourceId).units"
          item-title="name"
          item-value="id"
          hide-details
          :label="$t('Unit')"
          class="mr-2"
          style="width: 50%"
          :outlined="outlined"
          :placeholder="$t('Unit')"
          @blur="fillIfEmtpy"
        />
        <v-text-field
          v-model="r.amount"
          hide-details
          :label="$t('Qty')"
          :outlined="outlined"
          :placeholder="$t('Amount')"
          type="number"
          min="0"
          @blur="fillIfEmtpy"
        />
        <v-btn
          text=""
          flat
          icon="mdi-close"
          @click="deleteRow(r)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
