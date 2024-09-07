<template>
  <n-notification-provider>
    <n-message-provider>
      <router-view />
      <base-form-dialog />
    </n-message-provider>
  </n-notification-provider>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'
  import BaseFormDialog from "@/views/BaseWidget/form/BaseFormDialog.vue";

  export default defineComponent({
    name: 'App',
    components: {BaseFormDialog},
  })
</script>
<style>
::-webkit-scrollbar{
  display: none;
}
</style>
