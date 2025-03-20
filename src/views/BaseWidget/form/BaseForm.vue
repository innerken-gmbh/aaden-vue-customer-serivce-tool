<!--
  - Copyright (c) 2024. Haodong JU
  -->

<template>
  <v-card
    v-if="show"
    elevation="0"
  >
    <page-sub-header class="mb-6">
      <slot />
      <template #subtitle>
        <slot name="subtitle" />
      </template>
      <template #action>
        <j-space>
          <seondary-inline-button
            text="Abort"
            icon="mdi-close"
            @click="emit('close')"
          />
        </j-space>
      </template>
    </page-sub-header>
    <loading-provider :loading="loading">
      <v-form
        ref="form"
        v-model="formValid"
        lazy-validation
      >
        <div>
          <div
            v-for="(f) in fields"
            :key="f.key"
          >
            <div
              v-if="f.hide(holderObject)"
              class="d-flex"
            >
              <div
                class="text-body-1 mr-2"
                style="max-width: 48%;"
              >
                <div class="font-weight-bold">
                  {{ f.name }}<span v-if="f.required">*</span>
                </div>
                <div class="text-body-2">
                  {{ f.hint }}
                </div>
              </div>
              <v-spacer />
              <div
                class="d-flex justify-end"
                style="width: 50%;"
              >
                <component
                  :is="f.component"
                  v-if="holderObject"
                  v-model="holderObject[f.key]"
                  dense
                  v-bind="f.componentProps"
                />
              </div>
            </div>
          </div>
        </div>
      </v-form>
    </loading-provider>
    <primary-button
      v-if="!loading"
      full=""
      :disabled="!formValid"
      icon="mdi-content-save"
      text="Save"
      @click="submit"
    />
  </v-card>
</template>

<script setup>
import {computed, nextTick, ref, watch} from "vue";
import PageSubHeader from "@/views/BaseWidget/basic/PageSubHeader.vue";
import {mapSchemaToField} from "@/views/BaseWidget/form/baseFormUtils";
import LoadingProvider from "@/views/BaseWidget/basic/premade/LoadingProvider.vue";
import PrimaryButton from "@/views/BaseWidget/basic/button/PrimaryButton.vue";
import SeondaryInlineButton from "@/views/BaseWidget/basic/button/SeondaryInlineButton.vue";
import JSpace from "@/views/BaseWidget/basic/JSpace.vue";

const emit = defineEmits(['submit', 'close'])


const props = defineProps({
  schema: {
    type: Array,
    default: () => []
  },
  editingObject: {
    type: Object,
    required: false,
    default: () => null
  },
  loading: {
    type: Boolean,
    default: false
  },
  show: {
    type: Boolean,
    default: true
  }
})
const formValid = ref(null)
const form = ref(null)
const holderObject = ref({})
const fields = computed(() => {
  return props.schema.map(mapSchemaToField)
})
watch(() => props.schema, (value) => {
  reset()
},{deep: true,immediate: true})
watch(() => props.show, () => {
  reset()
})
watch(() => props.editingObject, () => {
  nextTick(() => {
    reset()
  })
})

function submit() {
  if (form.value.validate()) {
    emit('submit', holderObject.value)
  }
}

function reset() {
  if (props.editingObject) {
    holderObject.value = Object.assign({}, Object.fromEntries(props.schema.map(it => [it.key, it.default])),props.editingObject)
  } else {
    holderObject.value = Object.fromEntries(props.schema.map(it => [it.key, it.default]))
  }
}


</script>

<style scoped>

</style>
