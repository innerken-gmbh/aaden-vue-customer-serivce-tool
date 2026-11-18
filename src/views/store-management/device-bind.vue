<template>
  <div>
    <div class="pa-4 pb-0">
      <div class="text-h5">
        老板端 App（Aaden 管家）账号绑定
      </div>
      <div class="text-body-2 text-medium-emphasis">
        这里绑的是老板手机上「Aaden 管家」App 的登录账号，不是网页后台（Portal / 会员后台）的账号。
      </div>
    </div>
    <div class="pa-4">
      <v-card
        class="pa-4"
        max-width="1224px"
      >
        <div class="text-h6 mb-2">
          按邮箱查账号，绑到门店
        </div>
        <div class="d-flex align-center">
          <v-text-field
            v-model="bossEmail"
            label="老板端 App 登录邮箱"
            clearable
            hide-details
            @keyup.enter="lookupBossAccount"
          />
          <v-btn
            class="ml-4"
            :loading="bossLookupLoading"
            :disabled="!bossEmail"
            color="blue lighten-2"
            variant="outlined"
            @click="lookupBossAccount"
          >
            查询
          </v-btn>
        </div>
        <v-alert
          v-if="bossAccount && !bossAccount.found"
          class="mt-4"
          type="warning"
          variant="tonal"
        >
          这个邮箱还没有账号，请先让对方登录一次（用这个邮箱登录 Aaden 管家 App），再来查。
        </v-alert>
        <template v-if="bossAccount && bossAccount.found">
          <v-card
            class="mt-4 pa-4"
            variant="outlined"
          >
            <div class="d-flex align-center">
              <div>
                <div class="text-subtitle-1">
                  {{ bossAccount.email }}
                  <span v-if="bossAccount.displayName">（{{ bossAccount.displayName }}）</span>
                </div>
                <div class="text-caption text-medium-emphasis">
                  UID: {{ bossAccount.firebaseUid }}
                </div>
              </div>
              <v-spacer />
              <v-chip
                v-if="bossAccount.disabled"
                color="red"
              >
                账号已停用，不能绑定
              </v-chip>
            </div>
            <div class="mt-2">
              <div class="text-body-2 mb-1">
                已绑定的门店（{{ bossAccount.stores.length }}）
              </div>
              <div v-if="bossAccount.stores.length === 0" class="text-caption text-medium-emphasis">
                还没有绑定任何门店
              </div>
              <v-chip
                v-for="store in bossAccount.stores"
                :key="store.deviceId"
                class="mr-2 mb-2"
                :color="store.isOwner ? 'green' : undefined"
              >
                {{ store.deviceId }}<span v-if="store.storeName">&nbsp;{{ store.storeName }}</span><span v-if="store.isOwner">&nbsp;· 主账号</span>
              </v-chip>
            </div>
          </v-card>
          <div
            v-if="!bossAccount.disabled"
            class="d-flex align-center mt-4"
          >
            <v-text-field
              v-model="bossDeviceIds"
              label="要绑定的门店号（可多家，用逗号或空格隔开，如 1805, 1536）"
              clearable
              hide-details
            />
            <v-btn
              class="ml-4"
              :loading="bossBindLoading"
              :disabled="parsedBossDeviceIds.length === 0"
              color="primary"
              @click="bindBossAccount"
            >
              绑定到 {{ parsedBossDeviceIds.length }} 家门店
            </v-btn>
          </div>
          <div
            v-if="bossBindOutcomes.length > 0"
            class="mt-4"
          >
            <v-alert
              v-for="item in bossBindOutcomes"
              :key="item.deviceId"
              class="mb-2"
              density="compact"
              variant="tonal"
              :type="outcomeView(item.outcome).type"
            >
              {{ item.deviceId }}<span v-if="item.storeName">（{{ item.storeName }}）</span>：{{ outcomeView(item.outcome).text }}
            </v-alert>
          </div>
        </template>
      </v-card>
    </div>
    <div class="d-flex main-container pa-4">
      <v-card
        class="pa-4"
        max-width="600px"
      >
        <div class="d-flex align-center justify-center text-h5 mb-4">
          按 UID 绑定（已知 UID 时用）
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

import {computed, onMounted, ref, watch, watchEffect} from "vue";
import {unbindingDevice,bindDeviceWithMain, bindDeviceWithoutMain, getBindingKeyByDeviceId, checkDeviceUuid, lookupBossAppAccount, bindBossAppAccount} from "@/store/aaden/businessLayer";

// 老板端 App（Aaden 管家）账号：按邮箱查 → 绑到多家门店（POS-775）
const bossEmail = ref('')
const bossAccount = ref(null)
const bossLookupLoading = ref(false)
const bossDeviceIds = ref('')
const bossBindLoading = ref(false)
const bossBindOutcomes = ref([])

const parsedBossDeviceIds = computed(() => [...new Set((bossDeviceIds.value ?? '')
  .split(/[\s,，、;；]+/)
  .map(it => it.trim())
  .filter(it => it))])

watch(bossEmail, () => {
  // 换了邮箱，上一次查到的账号就不再对应，避免绑错人
  bossAccount.value = null
  bossBindOutcomes.value = []
})

async function lookupBossAccount () {
  if (!bossEmail.value) return
  bossLookupLoading.value = true
  bossBindOutcomes.value = []
  try {
    bossAccount.value = await lookupBossAppAccount(bossEmail.value.trim())
  } finally {
    // 失败时 erpStoreBindingJson 已经弹过提示
    bossLookupLoading.value = false
  }
}

async function bindBossAccount () {
  bossBindLoading.value = true
  try {
    const result = await bindBossAppAccount(bossEmail.value.trim(), parsedBossDeviceIds.value)
    if (!result.found) {
      bossAccount.value = {found: false}
      return
    }
    bossBindOutcomes.value = result.outcomes ?? []
    bossAccount.value = {...bossAccount.value, disabled: result.disabled, stores: result.stores ?? bossAccount.value.stores}
    if (bossBindOutcomes.value.every(it => it.outcome !== 'STORE_NOT_FOUND')) bossDeviceIds.value = ''
  } finally {
    bossBindLoading.value = false
  }
}

function outcomeView (outcome) {
  switch (outcome) {
    case 'BOUND': return {type: 'success', text: '已绑定'}
    case 'ALREADY_BOUND': return {type: 'info', text: '之前就绑定了，没有重复建'}
    case 'STORE_NOT_FOUND': return {type: 'error', text: '没找到这家门店，请检查门店号'}
    default: return {type: 'warning', text: outcome}
  }
}

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
  try {
    await unbindingDevice(unbindDeviceId.value,unbindUuid.value)
  } finally {
    // 失败时 erpStoreBindingPost 已经弹过提示
    unbindLoading.value = false
  }
}

async function searchBindingKey () {
  bindingKey.value = await getBindingKeyByDeviceId(checkDeviceId.value)
}

async function bindDeviceWithUid () {
  loading.value = true
  try {
    if (isMain.value) {
      await bindDeviceWithMain(bindingKey.value, uid.value)
    } else {
      await bindDeviceWithoutMain(uid.value, deviceId.value)
    }
  } finally {
    // 失败时 erpStoreBindingPost 已经弹过提示
    loading.value = false
  }
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
