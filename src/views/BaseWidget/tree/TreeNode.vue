<!--
  - Copyright (c) 2024. Haodong JU
  -->


<script setup>

import ToggleButton from "@/views/BaseWidget/basic/button/ToggleButton.vue";
import TreeNode from "./TreeNode.vue";
import {computed, onMounted, ref} from "vue";

const props = defineProps({
  treeNode: {
    type: Object,
    required: true
  },
  currentLevel: {
    type: Number,
    default: 0
  },
  identityKey: {
    type: String,
    default: 'id'
  },
  nameKey: {
    type: String,
    default: 'name',
  },
  defaultExpand: {
    type: Boolean,
    default: true
  },
  menus: {},
  childrenKey: {
    type: String,
    default: 'children'
  },
  active: {}
})
const expand = ref(true)
const isActive = computed(() => {
  return props.treeNode[props.identityKey] === props.active
})
const haveChildren = computed(() => {
  return props.treeNode?.[props.childrenKey]?.length > 0
})
onMounted(() => {
  expand.value = props.defaultExpand
})
const emit = defineEmits(['selected', 'menu-click'])
</script>
<template>
  <div>
    <v-card
      :class="isActive?'font-weight-black':''"
      :color="isActive?'grey-lighten-4':''"
      elevation="0"
      class="d-flex align-center pa-2"
      @click="emit('selected',treeNode[identityKey])"
    >
      <div
        style="width: 22px"
      >
        <toggle-button
          v-if="haveChildren"
          v-model="expand"
          true-icon="mdi-menu-down"
          false-icon="mdi-menu-right"
        />
      </div>
      <div
        v-if="treeNode.icon"
        class="text-body-2 mr-1"
      >
        {{ treeNode.icon }}
      </div>
      <v-icon
        v-else
        small
        class="mr-2"
      >
        {{ 'mdi-file-tree-outline' }}
      </v-icon>
      <div class="text-body-2 text-truncate ">
        {{ treeNode[nameKey] }}
      </div>
      <v-spacer />

      <v-menu
        v-if="menus.length>0"
        offset-y
      >
        <template #activator="{props}">
          <v-btn
            v-bind="props"
            elevation="0"
            size="small"
            icon=""
            density="compact"
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list
          v-if="menus"
          width="200"
        >
          <v-list-item
            v-for="m in menus"
            :key="m.name"
            @click="emit('menu-click',m.name,treeNode[identityKey])"
          >
            <template #prepend>
              <v-icon>{{ m.icon }}</v-icon>
            </template>
            <v-list-item-title>{{ m.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card>
    <div
      v-if="haveChildren&&(expand)"
      class="pl-4"
    >
      <tree-node
        v-for="c in treeNode[childrenKey]"
        :key="c[identityKey]"
        :current-level="currentLevel+1"
        :tree-node="c"
        :menus="menus"
        :identity-key="identityKey"
        :children-key="childrenKey"
        :active="active"
        @selected="e=>emit('selected',e)"
        @menu-click="(...args)=>emit('menu-click',...args)"
      />
    </div>
  </div>
</template>
<style scoped>

</style>
