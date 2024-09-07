<script setup>
import {computed} from "vue";

const props = defineProps({
  color: {
    type: String,
    default: ''
  },
  small: {
    type: Boolean,
    default: false
  },
  fitContent: {
    type: Boolean,
    default: false
  },
  flex: {
    type: Boolean,
    default: true
  },
  disabled: {}
})
const defaultClass = computed(() => {
  let cl = props.small ? 'pa-2' : 'pa-3 px-4'
  if (props.flex) {
    cl += " d-flex align-center justify-center"
  }
  return cl

})
const emit = defineEmits(['click'])
</script>

<template>
  <v-card
    :disabled="disabled"
    :width="fitContent?'fit-content':'100%'"
    :color="disabled?'grey-lighten-2 disabled--text':color"
    :class="defaultClass"
    elevation="0"
    class="text-body-2
       rounded-lg"
    @click.stop="emit('click')"
  >
    <slot />
  </v-card>
</template>

<style scoped>

</style>
