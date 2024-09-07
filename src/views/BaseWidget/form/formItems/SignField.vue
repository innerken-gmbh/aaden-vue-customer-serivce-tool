<script setup>
import {onMounted, ref} from "vue";
import BaseContainer from "@/views/BaseWidget/basic/BaseContainer.vue";
import SecondaryButton from "@/views/BaseWidget/basic/button/SecondaryButton.vue";
import dayjs from "dayjs";

const model = defineModel()
const props = defineProps(['required', 'rules'])
const confirmed = ref(false)
const sign = ref(null)


async function reset() {
  sign.value.reset()
  confirmed.value = false
}

async function dataUrlToBlob(url) {
  const blob = await (await fetch(url)).blob()
  return new File([blob], dayjs().valueOf() + '.png', {type: 'image/png'})
}

onMounted(() => {
  console.log(model.value,'model value')
})

async function generate() {
  const file = await sign.value.generate()
  confirmed.value = true
  model.value = await dataUrlToBlob(file)
}

</script>

<template>
  <div
    class="mb-4"
    style="position: relative"
  >
    <v-file-input
      v-model="model"
      :error="!confirmed"
      :rules="[...rules, v => !!v || $t('CantBeEmpty'),]"
      style="position: absolute;top: 0"
    />
    <base-container
      small
      :flex="false"
      color="grey-lighten-4"
    >
      <vue-esign
        ref="sign"
        :is-crop="true"
      />
    </base-container>
    <div class="d-flex mt-2">
      <secondary-button
        v-if="!confirmed"
        class="mr-2"
        @click="reset"
      >
        {{ $t('ReSign') }}
      </secondary-button>
      <secondary-button
        v-if="!confirmed"
        class=""
        @click="generate()"
      >
        {{ $t('ConfirmCompletedSignature') }}
      </secondary-button>
      <base-container
        v-else
        fit-content
        color="green-lighten-4"
        small
        @click="reset"
      >
        <v-icon left>
          mdi-check
        </v-icon>
        {{ $t('SignatureConfirmed') }}
      </base-container>
    </div>
  </div>
</template>

<style scoped>

</style>
