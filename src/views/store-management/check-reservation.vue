<template>
  <div class="main-container pa-4">
    <v-card
      class="pa-4"
      max-width="600px"
    >
      <div class="d-flex align-center justify-center text-h5 mb-4">
        开始今天的预定Debuger写入吧!
      </div>
      <div class="d-flex flex-column">
        <div
          class="d-flex align-center justify-center"
        >
          <div>
            ReserveDate
          </div>
          <v-spacer />
          <v-text-field
            v-model="reserveDate"
            label="YYYY-MM-DD"
            clearable
            width="500px"
          />
        </div>
        <div class="d-flex align-center justify-center">
          <div>
            PeopleCount
          </div>
          <v-spacer />
          <v-text-field
            v-model="peopleCount"
            label="人数"
            width="500px"
            clearable
          />
        </div>
        <div class="d-flex align-center justify-center">
          <div>
            deviceId
          </div>
          <v-spacer />
          <v-text-field
            v-model="userId"
            width="500px"
            clearable
          />
        </div>
        <div class="d-flex align-center justify-center">
          <div>
            internal (是否是内部的)
          </div>
          <v-spacer />
          <v-switch
            v-model="internal"
            color="primary"
          />
        </div>
        <div
          v-if="currentData"
          class="d-flex align-center justify-center"
        >
          <div>
            需要告诉世光的Id号
          </div>
          <v-spacer />
          {{ currentData }}
        </div>

        <div
          v-if="error"
          style="color: red"
        >
          {{ errorMessages }}
        </div>
        <div class="d-flex align-center justify-center mt-4">
          <v-btn
            :loading="loading"
            color="blue lighten-2"
            variant="outlined"
            width="100%"
            @click="setDebug"
          >
            生成记录
          </v-btn>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script lang="ts" setup>

import {ref} from "vue";
import {setDebugInfo} from "@/store/aaden/businessLayer";

const userId = ref('')
const peopleCount = ref('')
const loading = ref(false)
const error = ref(false)
const errorMessages = ref('')
const internal = ref(true)
const reserveDate = ref('')
const currentData = ref(null)


async function setDebug () {
  loading.value = true
  currentData.value = await setDebugInfo({
    reserveDate: reserveDate.value,
    peopleCount: peopleCount.value,
    userId: userId.value,
    internal: internal.value
  })
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
