<script setup>

import {normalActions} from "@/js/model/common/common";

defineProps({
  menu: {
    default: () => normalActions
  }
})
const emit = defineEmits(['menu-click'])
</script>

<template>
  <v-menu offset-y>
    <template #activator="{props}">
      <v-btn
        v-bind="props"
        icon
        elevation="0"
        size="small"
        density="compact"
      >
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </template>
    <v-list
      v-if="menu.length>0"
      width="200"
    >
      <v-list-item
        v-for="m in menu"
        :key="m.name"
        @click="emit('menu-click',m.name)"
      >
        <template #prepend>
          <v-icon>{{ m.icon }}</v-icon>
        </template>
        <v-list-item-title>{{ m.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<style scoped>

</style>
