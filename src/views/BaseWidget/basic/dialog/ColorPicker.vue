<script setup lang="ts">
const colorList = [
  '#FFCDD2', '#F8BBD0', '#E1BEE7',
  '#D1C4E9', '#C5CAE9', '#BBDEFB',
  '#B3E5FC', '#B2EBF2', '#B2DFDB',
  '#C8E6C9', '#DCEDC8', '#F0F4C3',
  '#FFF9C4', '#FFECB3', '#FFE0B2',
  '#FFCCBC', '#D7CCC8', '#CFD8DC',
  '#FFFFFF'
]
</script>

<template>
  <div class="mb-6">
    <v-dialog
      ref="dialog"
      v-model="startColorDialog"
      max-width="298px"
    >
      <template #activator="{ on, attrs }">
        <v-text-field
          v-model="currentColor"
          :label="$t('selectDate')"
          hide-details
          outlined
          prepend-inner-icon="mdi-calendar"
          readonly
          v-bind="attrs"
          v-on="on"
        />
      </template>
      <template>
        <div>
          <!-- 颜色方块选择器 -->
          <div class="color-picker">
            <div
              v-for="color in colorList"
              :key="color"
              class="color-square"
              :style="`background-color: ${color};`"
              @click="selectColor(color)"
            />
          </div>

          <!-- 显示选中的颜色 -->
          <div
            v-if="selectedColor"
            class="selected-color"
          >
            <div
              class="color-square"
              :style="`background-color: ${selectedColor};`"
            />
            <p>选中的颜色: {{ selectedColor }}</p>
          </div>
        </div>
      </template>
    </v-dialog>
  </div>
</template>

<style scoped lang="scss">

</style>
