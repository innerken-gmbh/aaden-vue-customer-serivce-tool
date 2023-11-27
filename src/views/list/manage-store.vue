<template>
  <div class="main-container">
    <n-card content-style="background:#f6f6f6" style="height: calc(100vh - 140px)">
      请输入设备ID
      <div class="d-flex align-center">
        <div style="width: 400px">
          <v-text-field
            hide-details
            density="compact"
            clearable="1"
            v-model="deviceId"
            @focus="deviceId = ''"
          />
        </div>
        <v-spacer />
        <div class="ml-2">
          <v-switch
            color="primary"
            hide-details
            density="compact"
            v-model="newValue"
            label="新版页面"
          />
        </div>
        <div class="ml-2">
          <v-switch
            color="primary"
            hide-details
            density="compact"
            v-model="appOrAdmin"
            label="前端/中台"
          />
        </div>

        <v-btn color="primary" class="ml-2" @click="refresh">刷新</v-btn>
      </div>
      <n-divider />
      <n-empty v-if="!show || !url" />
      <template v-else>
        <iframe
          :src="url"
          width="1368"
          height="768"
          class="shadow"
          style="background: white"
        ></iframe>
        <div class="mt-2">
          <n-text>
            {{ url }}
          </n-text>
        </div>
      </template>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue'

  const deviceId = ref('1')
  const show = ref(true)
  const newValue = ref(true)
  const appOrAdmin = ref(true)
  const url = computed(() => {
    const ngrokUrl = 'ik' + deviceId.value.padStart(4, '0') + '.ngrok.aaden.io'
    if (deviceId.value.length != 1 && deviceId.value.length != 4) {
      return ''
    }
    const endPoint = appOrAdmin.value ? 'App' : 'Admin'
    const base = parseInt(deviceId.value) > 6000 ? 'ht.api.aaden.io/ik' + deviceId.value : ngrokUrl

    if (newValue.value || parseInt(deviceId.value) > 6000) {
      return location.protocol + '//' + endPoint + '.aaden.io/?Base=' + base
    } else {
      return 'https://' + ngrokUrl + '/' + endPoint + '?Base=' + base
    }
  })

  function refresh() {
    show.value = false
    setTimeout(() => {
      show.value = true
    }, 300)
  }

  watch(url, refresh)
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
