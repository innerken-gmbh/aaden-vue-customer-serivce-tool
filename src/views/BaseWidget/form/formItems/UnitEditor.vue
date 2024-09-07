<script setup>
import {computed, nextTick, onMounted, ref, watchEffect} from "vue";
import IKUtils from "innerken-js-utils";

let counter = 0

const defaultUnitInfo = {name: '', nextLevelFactor: ''}
const props = defineProps(['modelValue', 'dense', 'required', 'outlined', 'rules'])
const unitArray = ref([])
const minUnitName = ref("")

watchEffect(() => {
  fillIfEmtpy()
})
const result = computed(() => {
  return [{name: minUnitName.value, nextLevelFactor: 1}, ...unitArray.value.filter(it => it.name && it.nextLevelFactor)]
})

function fillIfEmtpy() {
  const empty = unitArray.value.filter(it => !it.name && !it.nextLevelFactor)
  console.log(empty, 'empty')
  if (empty.length === 0) {
    unitArray.value.push(createRow())
  } else if (empty.length > 1) {
    unitArray.value = unitArray.value.filter(it => it.name || it.nextLevelFactor)
    unitArray.value.push(createRow())
  }
}

function createRow() {
  const row = IKUtils.deepCopy(defaultUnitInfo)
  row.key = counter++
  return row
}

const emit = defineEmits(['update:modelValue'])
onMounted(() => {
  nextTick(() => {
    if (props.modelValue?.length > 0) {
      const list = IKUtils.deepCopy(props.modelValue)
      const minUnit = list.shift()
      minUnitName.value = minUnit.name
      unitArray.value = list
    }
    watchEffect(() => {
      emit('update:modelValue', result.value)
    })

  })
})

</script>

<template>
  <div style="width: 100%">
    <v-text-field
      v-model="minUnitName"
      :placeholder="$t('InputItem', {configItem: $t('MinUnitPrice')})"
      :dense="dense"
      :outlined="outlined"
      :rules="rules"
      :required="required"
    />
    <div v-if="minUnitName">
      <div
        v-for="(r,index) in unitArray"
        :key="r.key"
        class="d-flex align-center mb-4"
      >
        <v-text-field
          v-model="r.name"
          style="width: 50%"
          hide-details
          :dense="dense"
          :outlined="outlined"
          :placeholder="$t('Name')"
          @blur="fillIfEmtpy"
        />
        <div class="mx-2">
          =
        </div>
        <v-text-field
          v-model="r.nextLevelFactor"
          hide-details
          :dense="dense"
          :outlined="outlined"
          :placeholder="$t('Amount')"
          type="number"
          min="0"
          @blur="fillIfEmtpy"
        />
        <div class="mx-2">
          &times;
        </div>
        {{ unitArray?.[index - 1]?.name ?? minUnitName }}
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
