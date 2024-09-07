<!--
  - Copyright (c) 2024. Haodong JU
  -->

<template>
  <v-card
    color="#f6f6f6"
    elevation="0"
    width="100%"
  >
    <v-img
      :src="imgSrc"
      :width="width"
    >
      <template #placeholder>
        <v-card
          :height="height"
          :width="width"
          tile
          class="d-flex align-center justify-center"
        >
          <v-icon>mdi-image</v-icon>
        </v-card>
      </template>
    </v-img>
  </v-card>
</template>

<script>
export default {
  name: 'ImgWithLoading',
  props: {
    imgSrc: {
      type: String,
      default: ''
    },
    height: {
      type: String,
      default: 'auto'
    },
    width: {
      type: String,
      default: '100%'
    }
  }
}
</script>

<style scoped>

</style>
