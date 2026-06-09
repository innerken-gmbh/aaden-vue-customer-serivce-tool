<script setup lang="ts">
import {ref} from "vue";
import IKUtils from "innerken-js-utils";
import {parseCsv, parseExcel, detectChineseEncoding} from "../../store/aaden/readFiles/readFiles"
import {getAttribute, setDishesAttrMasks} from "../../store/aaden/readFiles/Attribute"
import {getDishList, updateDish} from '../../store/aaden/readFiles/dish'
import {getNgrokPHPUrl} from "../../store/aaden/utils"
import {uniq} from "lodash-es";


const file = ref(null);
const fileData = ref([]);
const loading = ref(false);
const currentUrl = ref('')
const deviceId = ref('')
const log = ref([])
const step = ref('')

// 定义数据检查日志表格的列
const logColumns = [
  { title: 'index', key: 'index' },
  { title: 'value', key: 'value' },
  { title: 'reason', key: 'reason' }
]

async function handleFileUpload() {
  if (!deviceId.value) {
    IKUtils.showError('请先填写设备ID')
    return
  }

  if (file.value) {
    step.value = '正在阅读文件别慌！' + `<br>` + step.value
    loading.value = true;
    const fileType = file.value.name.split('.').pop()?.toLowerCase();
    if (fileType === 'csv') {
      const encodingType = (await detectChineseEncoding(file.value as any)).encoding;
      if (encodingType !== 'UTF-8') {
        IKUtils.showError('请使用UTF-8格式的csv');
        loading.value = false;
        return;
      }
      fileData.value = await parseCsv(file.value)
    } else if (fileType === 'xlsx') {
      fileData.value = await parseExcel(file.value)
    } else {
      IKUtils.showError('File Type is not csv or xlsx')
    }
    fileData.value = fileData.value.filter(it => it.Code)
    await uploadPrepare(fileData.value)
    loading.value  = false
  }
}

async function uploadPrepare(rawFileData) {
  log.value = []
  // 使用deviceId构建URL
  currentUrl.value = getNgrokPHPUrl(deviceId.value)
  await uploadAll(currentUrl.value, rawFileData)
  if (log.value.length === 0) {
    step.value = '文件上传完毕！' + step.value
  } else {
    step.value = '文件有问题,结束上传' + `<br>` + step.value
  }
}

async function uploadAll (url, rawFileData) {
  step.value = '开始给产品绑定Attribute' + `<br>` + step.value

  // 1) 计算一个数组：包含 rawFileData 中（去重后）除了 Code 以外的所有键
  const nonCodeKeys = Array.from(
    new Set(
      (Array.isArray(rawFileData) ? rawFileData : []).flatMap(row => Object.keys(row || {}))
    )
  ).filter(k => !['Code', 'code', 'CODE'].includes(k))
  const attributeDict = (await getAttribute(url))
  const currentAttributeInfo = []
  for (const key of nonCodeKeys) {
    const currentInfo = attributeDict.find(it => Array.isArray(it.langs) && it.langs.some(lang => lang?.name === key))
    if (currentInfo) {
      currentAttributeInfo.push(currentInfo)
    }
  }
  const allGroupIds = uniq(currentAttributeInfo.map(i => i.attributeGroupId))
  const allDishDict = await getDishList(url)
  const needHideAttribute = []
  for (const row of rawFileData) {
    const dishInfo = allDishDict.find(it => it.code.toString() === row.Code.toString())
    step.value = '开始给' + dishInfo?.dishName + '绑定' + `<br>` + step.value
    dishInfo.attributeGroupId = allGroupIds
    dishInfo.attributeGroup = allGroupIds
    await updateDish(url, dishInfo)
    const masks = []
    nonCodeKeys.forEach((key) => {
      if (row[key].toString() === '1') {
        const attributeInfo = currentAttributeInfo.find(it => Array.isArray(it.langs) && it.langs.some(lang => lang?.name === key))
        masks.push({agId:attributeInfo.attributeGroupId,aId:attributeInfo.id})
      }
    })
    needHideAttribute.push({dishId:dishInfo.dishId,masks:masks})
  }
  await setDishesAttrMasks(url,needHideAttribute)
  step.value = '结束绑定！'

}

function clearData() {
  file.value = null;
  fileData.value = [];
  deviceId.value = '';
  currentUrl.value = '';
  log.value = [];
  step.value = '';
}
</script>

<template>
  <div class="main-container pa-4">
    <n-card title="菜品属性绑定">
      <div class="upload-section">
        <n-space vertical>
          <div class="text-body-1 mb-2">
            请填写设备ID
          </div>
          <n-input
            v-model:value="deviceId"
            placeholder="请输入设备ID"
            class="mb-4"
          />

          <div class="text-body-1 mb-2">
            请上传CSV或Excel文件
          </div>
          <v-file-input
            v-model="file"
            label="选择文件"
            accept=".csv,.xlsx,.xls"
            :loading="loading"
          />
          <n-space>
            <n-button
              type="primary"
              :loading="loading"
              :disabled="!file"
              @click="handleFileUpload"
            >
              读取文件内容
            </n-button>
            <n-button
              :disabled="!file"
              @click="clearData"
            >
              清除
            </n-button>
          </n-space>
        </n-space>
      </div>

      <div
        v-if="step"
        class="mt-4"
      >
        <n-card
          title="处理步骤"
          class="log-card"
        >
          <div
            class="step-content"
            v-html="step"
          />
        </n-card>
      </div>

      <div
        v-if="!loading && fileData.length > 0"
        class="no-data mt-4"
      >
        <div>共{{ fileData.length }}条数据</div>
        <div
          v-if="currentUrl"
          class="mt-2"
        >
          当前设备URL: {{ currentUrl }}
        </div>
        <div
          v-if="log && log.length > 0"
          class="mt-4"
        >
          <n-card
            title="数据检查日志"
            class="log-card"
          >
            <n-data-table
              :columns="logColumns"
              :data="log"
              :bordered="false"
            />
          </n-card>
        </div>
      </div>

      <div
        v-else
        class="no-data mt-4"
      >
        <n-empty description="无数据或文件格式不正确" />
      </div>
    </n-card>
  </div>
</template>

<style scoped lang="scss">
.main-container {
  max-width: 1200px;
  margin: 0 auto;
}

.upload-section {
  margin-bottom: 20px;
}

.data-display {
  overflow-x: auto;
}

.log-card {
  margin-top: 10px;
}

.log-content, .step-content {
  white-space: pre-wrap;
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
