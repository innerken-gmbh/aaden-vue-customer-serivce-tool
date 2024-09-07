<script setup>
import TreeNode from "@/views/BaseWidget/tree/TreeNode.vue";
import {ref, watchEffect} from "vue";

const model = defineModel()
const props = defineProps({
  treeNodeList: {
    type: Array
  },
  childrenKey: {
    type: String,
    default: 'children'
  },
  identityKey: {
    type: String,
    default: 'id'
  },
  nameKey: {
    type: String,
    default: 'name',
  },
  menus: {
    type: Array,
    default: () => []
  },
  value: {},
})
const active = ref(null)
const emit = defineEmits(['menu-click'])
watchEffect(() => {
  active.value = model.value
})

function select(e) {
  active.value = e
  if(model.value!==active.value){
    model.value = active.value
  }

}
</script>

<template>
  <div>
    <tree-node
      v-for="n in treeNodeList"
      :key="n[identityKey]"
      :children-key="childrenKey"
      :identity-key="identityKey"
      :name-key="nameKey"
      :active="active"
      :menus="menus"
      :tree-node="n"
      @selected="select"
      @menu-click="(...args)=>emit('menu-click',...args)"
    />
  </div>
</template>

<style scoped>

</style>
