<template>
  <div class="main-container pa-4">
    <v-card
      class="pa-4"
      max-width="600px"
    >
      <div class="d-flex align-center justify-center text-h5 mb-4">
        开始今天的绑定之旅吧!
      </div>
      <div class="d-flex flex-column">
        <div class="d-flex align-center justify-center">
          <div>
            Main User
          </div>
          <v-spacer />
          <v-switch
            v-model="isMain"
            color="primary"
          />
        </div>
        <div
          v-if="isMain"
          class="d-flex align-center justify-center"
        >
          <div>
            Binding Key
          </div>
          <v-spacer />
          <v-text-field
            v-model="bindingKey"
            clearable
            width="500px"
          />
        </div>
        <div
          v-else
          class="d-flex align-center justify-center"
        >
          <div>
            DeviceId
          </div>
          <v-spacer />
          <v-text-field
            v-model="deviceId"
            clearable
            width="500px"
          />
        </div>
        <div class="d-flex align-center justify-center">
          <div>
            Uid
          </div>
          <v-spacer />
          <v-text-field
            v-model="uid"
            width="500px"
            clearable
          />
        </div>

        <div
          v-if="error"
          style="color: red"
        >
          {{ errorMessages }}
        </div>
        <div class="d-flex align-center justify-center">
          <v-btn
            :loading="loading"
            color="blue lighten-2"
            variant="outlined"
            width="100%"
            @click="bindDeviceWithUid"
          >
            绑定
          </v-btn>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>

import {onMounted, ref} from "vue";
import {bindDeviceWithMain, bindDeviceWithoutMain} from "@/store/aaden/businessLayer";

const deviceId = ref('')
const uid = ref('')
const loading = ref(false)
const error = ref(false)
const errorMessages = ref('')
const isMain = ref(false)
const bindingKey = ref('')

onMounted(async () => {

})

async function bindDeviceWithUid () {
  loading.value = true
  if (isMain.value) {
    await bindDeviceWithMain(bindingKey.value, uid.value)
  } else {
    await bindDeviceWithoutMain(uid.value, deviceId.value)
  }
  loading.value = false
}


</script>

<style lang="scss" scoped>
.avatar-container {
  position: relative;
  width: 30px;
  height: 30px;
  margin: 0 auto;
  vertical-align: middle;

  .avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }

  .avatar-vip {
    border: 2px solid #cece1e;
  }

  .vip {
    position: absolute;
    top: 0;
    right: -9px;
    width: 15px;
    transform: rotate(60deg);
  }
}

.gender-container {
  .gender-icon {
    width: 20px;
  }
}
</style>
