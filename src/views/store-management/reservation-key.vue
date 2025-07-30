<template>
  <div class="main-container pa-4">
    <v-card
      class="pa-4"
      max-width="600px"
    >
      <div class="d-flex align-center justify-center text-h5 mb-4">
        Welcome To Aaden Reservation
      </div>
      <div class="d-flex flex-column">
        <div class="d-flex align-center justify-center">
          <div>
            DeviceId
          </div>
          <v-spacer />
          <v-text-field
            v-model="deviceId"
            width="500px"
          />
        </div>
        <div class="d-flex align-center justify-center">
          <div>
            Key
          </div>
          <v-spacer />
          <v-text-field
            v-model="keywords"
            width="500px"
          />
        </div>
        <div class="d-flex align-center justify-center">
          <v-btn
            color="blue lighten-2"
            variant="outlined"
            width="100%"
            @click="checkKey"
          >
            查看Key
          </v-btn>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>

import {onMounted, ref} from "vue";

const deviceId = ref('')
const keywords = ref('')

function checkKey () {
  createKey()
}

async function createKey() {
  // 将输入转换为字符串
  const str = deviceId.value.toString().padStart(6, '0');
  console.log(str, 'str')

  // 使用简单算法生成6位混合编码
  // 将每位数字转换为字母 (A=0, B=1, ..., J=9)
  let encrypted = '';
  for (let i = 0; i < str.length; i++) {
    const digit = parseInt(str[i]);
    // 根据位置索引调整转换规则
    const charCode = 65 + (digit + i * 3) % 26; // A-Z
    encrypted += String.fromCharCode(charCode);
  }

  keywords.value = encrypted // 返回大写形式
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
