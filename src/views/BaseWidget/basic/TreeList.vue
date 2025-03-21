<script setup>
import {ref, watchEffect} from "vue";
import TreeNode from "@/views/BaseWidget/basic/TreeNode.vue";

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
watchEffect(() => {
  active.value = model.value
})
const emit = defineEmits(['selected', 'menu-click'])
function select(e) {
  active.value = e
  if(model.value!==active.value){
    model.value = active.value
  }
  emit('selected',e)
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
