<template>
  <div class="main-container">
    <n-card content-style="background:#f6f6f6" style="height: calc(100vh - 140px)">
      请输入设备ID

      <n-space>
        <n-input clearable v-model:value="deviceId" @focus="deviceId = ''" />
        <n-button type="primary" @click="refresh">刷新</n-button>
      </n-space>
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
  import { computed, ref, watch, watchEffect } from 'vue'

  const deviceId = ref('1')
  const show = ref(true)
  const url = computed(() => {
    const ngrokUrl = 'ik' + deviceId.value.padStart(4, '0') + '.ngrok.aaden.io'
    if (deviceId.value.length != 1 && deviceId.value.length != 4) {
      return ''
    }
    if (parseInt(deviceId.value) > 6000) {
      return location.protocol + '//app-beta.aaden.io/?Base=' + deviceId.value.padStart(4, '0')
    } else {
      return location.protocol + '//' + ngrokUrl + '/App?Base=' + ngrokUrl
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
