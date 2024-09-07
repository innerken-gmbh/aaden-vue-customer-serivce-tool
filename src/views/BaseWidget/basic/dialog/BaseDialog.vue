<script setup>
import {useDisplay} from "vuetify";

const model = defineModel()

const props = defineProps(['maxWidth', 'persistent'])


const emit = defineEmits(['input'])

const {smAndDown} = useDisplay()

</script>

<template>
  <v-dialog
    v-model="model"
    :persistent="persistent"
    :max-width="maxWidth??600"
    :fullscreen="smAndDown"
  >
    <div
      elevation="0"
    >
      <v-card
        style="max-height: 70vh;overflow-y: scroll"
        height="100%"
        elevation="0"
        rounded="lg"
        class="pa-6"
      >
        <slot />
      </v-card>
    </div>
  </v-dialog>
</template>

<style scoped>

</style>
