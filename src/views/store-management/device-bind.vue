<template>
  <div>
    <div class="d-flex main-container pa-4">
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
      <v-spacer />
      <v-card
        class="pa-4"
        max-width="600px"
      >
        <div class="d-flex align-center justify-center text-h5 mb-4">
          查询Binding Key
        </div>
        <div class="d-flex flex-column">
          <div
            class="d-flex align-center justify-center"
          >
            <div>
              DeviceId
            </div>
            <v-spacer />
            <v-text-field
              v-model="checkDeviceId"
              clearable
              width="500px"
            />
          </div>
          <div class="d-flex align-center justify-center">
            <v-btn
              :loading="loading"
              color="blue lighten-2"
              variant="outlined"
              width="100%"
              @click="searchBindingKey"
            >
              查询
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>
    <div class="d-flex main-container pa-4">
      <v-card
        class="pa-4"
        max-width="600px"
      >
        <div class="d-flex align-center justify-center text-h5 mb-4">
          解绑
        </div>
        <div class="d-flex flex-column">
          <div
            class="d-flex align-center justify-center"
          >
            <div>
              DeviceId
            </div>
            <v-spacer />
            <v-text-field
              v-model="unbindDeviceId"
              clearable
              width="500px"
            />
          </div>
          <div
            class="d-flex align-center justify-center"
          >
            <div>
              FireBaseUuid
            </div>
            <v-spacer />
            <v-text-field
              v-model="unbindUuid"
              clearable
              width="500px"
            />
          </div>
          <div class="d-flex align-center justify-center">
            <v-btn
              :loading="unbindLoading"
              color="blue lighten-2"
              variant="outlined"
              width="100%"
              @click="unbind"
            >
              解绑
            </v-btn>
          </div>
        </div>
      </v-card>
      <v-spacer />
      <v-card
        class="pa-4"
        max-width="600px"
      >
        <div class="d-flex align-center justify-center text-h5 mb-4">
          查询Uuid
        </div>
        <div class="d-flex flex-column">
          <div
            class="d-flex align-center justify-center"
          >
            <div>
              DeviceId
            </div>
            <v-spacer />
            <v-text-field
              v-model="checkUuidWithDeviceId"
              clearable
              width="500px"
            />
          </div>
          <template
            v-if="currentUuidList.length > 0"
          >
            <v-card
              v-for="item in currentUuidList"
              :key="item.deviceId"
              elevation="0"
              class="pa-4 d-flex align-center justify-center"
            >
              <div>
                <v-icon
                  v-if="item.isOwner"
                  color="green"
                >
                  mdi-check-decagram
                </v-icon>UUID: {{ item.firebaseUid }}
              </div>
              <v-spacer />
              <div>EMAIL: {{ item.email }}</div>
            </v-card>
          </template>
          <div class="d-flex align-center justify-center">
            <v-btn
              color="blue lighten-2"
              variant="outlined"
              width="100%"
              :loading="checkUuidLoading"
              @click="findUuidWithDeviceId"
            >
              查询Uuid
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>

import {onMounted, ref, watch, watchEffect} from "vue";
import {unbindingDevice,bindDeviceWithMain, bindDeviceWithoutMain, getBindingKeyByDeviceId, checkDeviceUuid} from "@/store/aaden/businessLayer";

const deviceId = ref('')
const uid = ref('')
const loading = ref(false)
const error = ref(false)
const errorMessages = ref('')
const isMain = ref(false)
const bindingKey = ref('')
const checkDeviceId = ref('')
const unbindUuid = ref('')
const unbindDeviceId = ref('')
const unbindLoading = ref(false)
const checkUuidWithDeviceId = ref('')
const currentUuidList = ref([])
const checkUuidLoading = ref(false)

onMounted(async () => {

})

watch(checkUuidWithDeviceId, () => {
  if (!checkUuidWithDeviceId.value) {
    currentUuidList.value = []
  }
})

async function findUuidWithDeviceId () {
  checkUuidLoading.value = true
  currentUuidList.value = await checkDeviceUuid(checkUuidWithDeviceId.value)
  checkUuidLoading.value = false
}

async function unbind () {
  unbindLoading.value = true
  await unbindingDevice(unbindDeviceId.value,unbindUuid.value)
  unbindLoading.value = false
}

async function searchBindingKey () {
  bindingKey.value = await getBindingKeyByDeviceId(checkDeviceId.value)
}

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
