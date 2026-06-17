<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getAydenRules, addSplitConfigurationRule, removeSplitConfigurationRule } from '@/store/ayden/aydenRules'
import IKUtils from "innerken-js-utils";

// Tabs 当前激活索引
const activeIndex = ref<number>(0)

const hasAccess = computed(() => {
  const user = IKUtils.getQueryString('User')
  return user === 'WuWenZe'
})

// 规则列表：期望结构为 [{ description: string, rules: any[] }, ...]
const rules = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function reload() {
  loading.value = true
  error.value = null
  try {
    const resp = await getAydenRules()
    // 兼容不同返回结构
    const list = Array.isArray(resp)
      ? resp
      : Array.isArray(resp?.data)
        ? resp.data
        : Array.isArray(resp?.result)
          ? resp.result
          : []
    rules.value = list
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (hasAccess.value) {
    reload()
  }
})

// 监听权限变更，若后续通过（例如用户手动添加了查询参数），则拉取数据
watch(hasAccess, (ok) => {
  if (ok) reload()
})

const tabLabels = computed(() =>
  rules.value.map((it, idx) => it?.description || `Tab ${idx + 1}`)
)

// 数据表头
const headers = [
  { title: 'CardRegion', key: 'cardRegion', align: 'start' },
  { title: 'Currency', key: 'currency', align: 'start' },
  { title: 'FundingSource', key: 'fundingSource' },
  { title: 'PaymentMethod', key: 'paymentMethod' },
  { title: 'ShopperInteraction', key: 'shopperInteraction' },
  { title: 'chargeback', key: 'splitLogic.chargeback' },
  { title: 'commission', key: 'splitLogic.commission' },
  { title: 'paymentFee', key: 'splitLogic.paymentFee' },
  { title: '操作', key: 'actions', align: 'center' },
]

// fundingSource 可选项列表（下拉）
const fundingSourceOptions = [
  'credit',
  'debit',
  'prepaid',
  'deferred_debit',
  'charged',
  'ANY',
]

// shopperInteraction 可选项列表（下拉）
const shopperInteractionOptions = [
  'Ecommerce',
  'ContAuth',
  'Moto',
  'POS',
  'ANY',
]

const cardRegionOptions = [
    'domestic',
    'international',
    'interRegional',
    'intraRegional',
    'ANY'
]

function stringify(val: any) {
  try {
    return JSON.stringify(val, null, 2)
  } catch (e) {
    return String(val)
  }
}

// 编辑对话框状态（表单键值对模式）
const editDialog = ref(false)
const currentItem = ref<any | null>(null)

// 键值对表单项
interface KeyValue { key: string; value: string }
const editEntries = ref<KeyValue[]>([])

function isPlainObject(val: any) {
  return Object.prototype.toString.call(val) === '[object Object]'
}

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const out: Record<string, any> = {}
  Object.keys(obj || {}).forEach((k) => {
    const val = (obj as any)[k]
    const path = prefix ? `${prefix}.${k}` : k
    if (isPlainObject(val)) {
      Object.assign(out, flattenObject(val, path))
    } else if (Array.isArray(val)) {
      val.forEach((v, i) => {
        const ap = `${path}.${i}`
        if (isPlainObject(v) || Array.isArray(v)) {
          Object.assign(out, flattenObject(v, ap))
        } else {
          out[ap] = v
        }
      })
    } else {
      out[path] = val
    }
  })
  return out
}

function smartParse(input: string): any {
  const s = input?.trim()
  if (s === '') return ''
  if (s === 'null') return null
  if (s === 'true') return true
  if (s === 'false') return false
  if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s)
  try {
    return JSON.parse(s)
  } catch {
    return input
  }
}

function unflattenObject(flat: Record<string, any>): any {
  const result: any = {}
  for (const rawPath in flat) {
    const parts = rawPath.split('.')
    let cur: any = result
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1
      const nextIsIndex = !isLast && /^\d+$/.test(parts[i + 1])
      if (isLast) {
        cur[part] = flat[rawPath]
      } else {
        if (cur[part] == null) {
          cur[part] = nextIsIndex ? [] : {}
        }
        cur = cur[part]
      }
    }
  }
  return result
}

function openEditDialog(item: any) {
  currentItem.value = item
  const flat = flattenObject(item)
  // 过滤不要的字段：ruleId 与 splitLogic.splitLogicId
  const entries: KeyValue[] = Object.entries(flat)
    .filter(([k]) => k !== 'ruleId' && k !== 'splitLogic.splitLogicId')
    .map(([k, v]) => ({
      key: k,
      value: typeof v === 'string' ? v : stringify(v),
    }))

  // 确保在开头添加 cardRegion 字段：
  // - 若已存在则移至最前
  // - 若不存在则以空值添加在最前
  const idx = entries.findIndex((e) => e.key === 'cardRegion')
  let cardRegionEntry: KeyValue
  if (idx !== -1) {
    cardRegionEntry = entries.splice(idx, 1)[0]
  } else {
    cardRegionEntry = {
      key: 'cardRegion',
      value: 'ANY',
    }
  }

  editEntries.value = [cardRegionEntry, ...entries]
  editDialog.value = true
}

async function save() {
  // 将键值对还原为原始结构对象，并复制为 JSON 文本
  const flat: Record<string, any> = {}
  editEntries.value.forEach(({ key, value }) => {
    flat[key] = smartParse(value)
  })
  const restored = unflattenObject(flat)
  const configurationId = rules.value[activeIndex.value].splitConfigurationId
  await addSplitConfigurationRule(configurationId, restored)
  // 可按需关闭对话框
  editDialog.value = false
  await reload()

}

async function removeRules (item) {
  const configurationId = rules.value[activeIndex.value].splitConfigurationId
  await removeSplitConfigurationRule (configurationId, item.ruleId)
  await reload()
}
</script>

<template>
  <div
    v-if="hasAccess"
    class="p-4"
  >
    <!-- 加载与错误提示 -->
    <v-alert
      v-if="error"
      type="error"
      class="mb-4"
      dense
    >
      {{ error }}
    </v-alert>

    <v-skeleton-loader
      v-if="loading && rules.length === 0"
      type="heading, paragraph, image"
      class="mb-4"
    />

    <!-- Tabs Header -->
    <v-tabs
      v-model="activeIndex"
      grow
      class="mb-4"
    >
      <v-tab
        v-for="(label, i) in tabLabels"
        :key="i"
        :value="i"
      >
        {{ label }}
      </v-tab>
    </v-tabs>

    <!-- Tabs Content -->
    <v-window v-model="activeIndex">
      <v-window-item
        v-for="(group, gi) in rules"
        :key="gi"
        :value="gi"
      >
        <div v-if="Array.isArray(group?.rules) && group.rules.length > 0">
          <v-data-table
            :headers="headers"
            :items="group.rules"
            :loading="loading"
            density="compact"
            class="elevation-1"
            :fixed-header="true"
            height="500px"
          >
            <template #[`item.name`]="{ item }">
              {{ item?.name || item?.title || item?.id || '—' }}
            </template>
            <template #[`item.description`]="{ item }">
              <span class="text-sm text-gray-600">{{ item?.description || '—' }}</span>
            </template>
            <template #[`item.json`]="{ item }">
              <pre class="text-xs whitespace-pre-wrap break-all max-w-[60ch]">{{ stringify(item) }}</pre>
            </template>
            <template #[`item.actions`]="{ item }">
              <v-btn
                size="small"
                variant="text"
                color="primary"
                :title="'编辑并复制当前行'"
                @click="openEditDialog(item)"
              >
                <v-icon
                  icon="mdi-content-copy"
                  size="18"
                  class="mr-1"
                />
                复制
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="primary"
                @click="removeRules(item)"
              >
                <v-icon
                  icon="mdi-delete"
                  size="18"
                  class="mr-1"
                />
                删除
              </v-btn>
            </template>
            <template #no-data>
              <div class="py-6 text-center text-gray-500">
                暂无数据
              </div>
            </template>
          </v-data-table>
        </div>

        <v-empty-state
          v-else
          headline="暂无规则"
          title="No Rules"
          description="当前分组下没有可显示的规则"
        />
      </v-window-item>
    </v-window>

    <!-- 编辑并复制对话框（键值对表单） -->
    <v-dialog
      v-model="editDialog"
      max-width="900"
    >
      <v-card>
        <v-card-title class="text-base">
          编辑规则
        </v-card-title>
        <v-card-text>
          <div class="space-y-2 max-h-[60vh] overflow-auto pr-2">
            <div
              v-for="(entry, idx) in editEntries"
              :key="idx"
              class="flex items-center gap-3"
            >
              <div class="w-56 text-xs font-mono text-gray-600 break-all select-all">
                {{ entry.key }}
              </div>
              <v-select
                v-if="entry.key === 'fundingSource' || entry.key.endsWith('.fundingSource')"
                v-model="entry.value"
                :items="fundingSourceOptions"
                density="compact"
                hide-details="auto"
                class="flex-1"
              />
              <v-select
                v-else-if="entry.key === 'shopperInteraction' || entry.key.endsWith('.shopperInteraction')"
                v-model="entry.value"
                :items="shopperInteractionOptions"
                density="compact"
                hide-details="auto"
                class="flex-1"
              />
              <v-select
                v-else-if="entry.key === 'cardRegion' || entry.key.endsWith('.cardRegion')"
                v-model="entry.value"
                :items="cardRegionOptions"
                density="compact"
                hide-details="auto"
                class="flex-1"
              />
              <v-text-field
                v-else
                v-model="entry.value"
                density="compact"
                hide-details="auto"
                class="flex-1"
                :spellcheck="false"
              />
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="editDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            @click="save"
          >
            <v-icon
              icon="mdi-content-copy"
              size="18"
              class="mr-1"
            />
            新增
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
  <div
    v-else
    class="p-6"
  >
    <v-empty-state
      headline="没有权限"
      title="No Permission"
    />
    <v-alert
      type="warning"
      variant="tonal"
      class="mt-4"
    >
      当前链接缺少查询参数User
    </v-alert>
  </div>
</template>

<style scoped lang="scss">
.prose :deep(code) {
  background: rgba(0, 0, 0, 0.04);
  padding: 0.1rem 0.25rem;
  border-radius: 3px;
}
</style>
