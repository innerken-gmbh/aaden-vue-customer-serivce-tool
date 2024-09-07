<script setup>
defineProps(['text', 'color'])
const emit = defineEmits(['click'])

</script>

<template>
  <v-tooltip bottom>
    <template #activator="{props }">
      <v-card
        elevation="0"
        v-bind="props"
        :color="color??'grey-lighten-4'"
        class="pa-1 mr-1 px-1 d-flex align-center justify-center"
        @click.stop="emit('click')"
      >
        <div
          style="font-size: 0.6rem;"
          class="text-no-wrap font-weight-bold"
        >
          {{ text }}
        </div>
      </v-card>
    </template>
    <span>{{ text }}</span>
  </v-tooltip>
</template>

<style scoped>

</style>
