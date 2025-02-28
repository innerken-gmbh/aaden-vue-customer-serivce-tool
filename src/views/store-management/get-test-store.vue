<template>
  <div class="main-container pa-4">
    <v-card
      class="pa-4"
      max-width="600px"
    >
      <div class="d-flex align-center justify-center text-h5 mb-4">
        Welcome To Aaden
      </div>
      <div class="d-flex flex-column">
        <div class="d-flex align-center justify-center">
          <div>
            邮箱
          </div>
          <v-spacer />
          <v-text-field
            v-model="customerEmail"
            width="500px"
          />
        </div>
        <div class="d-flex align-center justify-center">
          <div>
            密码
          </div>
          <v-spacer />
          <v-text-field
            v-model="customerPassword"
            width="500px"
          />
        </div>
        <div class="d-flex align-center justify-center">
          <v-btn
            :loading="loading"
            color="blue lighten-2"
            variant="outlined"
            width="100%"
            @click="getCurrentStore"
          >
            申请测试门店
          </v-btn>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>

import {onMounted, ref} from "vue";
import {getTestDevice} from "@/store/aaden/cloud5-api";
import {createUserWithEmail, getCurrentUserId, loginWithEmailAndPassword} from "@/old/utils/firebase";
const customerEmail = ref('')
const customerPassword = ref(generateRandomString(9))
const loading = ref(false)

onMounted(async () => {
  console.log(customerEmail.value, '111')
})

async function getCurrentStore () {
  loading.value = true
  try {
    await loginWithEmailAndPassword(customerEmail.value, customerPassword.value)
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      try {
        await createUserWithEmail(email, password)
      } catch (e) {
        this.error = true
        this.errorMessages = e.message
      }
    } else {
      console.log(e.code, 'login')
      this.error = true
      this.errorMessages = e.message
    }
  }
  const userId = await getCurrentUserId()
  if (userId) {
    await getTestDevice(userId)
  }
  loading.value = false
}

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
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
