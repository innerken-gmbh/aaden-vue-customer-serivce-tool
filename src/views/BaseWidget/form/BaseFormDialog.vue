<script setup>

import BaseDialog from "@/views/BaseWidget/basic/dialog/BaseDialog.vue";
import BaseForm from "@/views/BaseWidget/form/BaseForm.vue";
import {useDialogStore} from "@/store/aaden/dialogStore";


const store = useDialogStore()

function finish(item) {
  if (store.resolve) {
    store.resolve(item)
  }
}
</script>

<template>
  <base-dialog v-model="store.dialogShow">
    <div style="max-height: 80vh;overflow-y: scroll">
      <base-form
        :show="store.dialogShow"
        :schema="store.dialogSchemas"
        :loading="store.loading"
        :editing-object="store.oldObject"
        @close="store.dialogShow=false"
        @submit="finish"
      >
        <template v-if="store.loading">
          {{ 'Loading' }}
        </template>
        <template v-else>
          {{ store.dialogTitle }}
        </template>
        <template
          v-if="!store.loading"
          #subtitle
        >
          {{ store.dialogSubtitle }}
        </template>
      </base-form>
    </div>
  </base-dialog>
</template>

<style scoped>

</style>
