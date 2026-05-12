<script setup lang="ts">
import { ref, h } from "vue";
import IKUtils from "innerken-js-utils";
import {parseCsv,parseExcel, hashCodeWithFiles,hashCodeWithSystem} from "../../store/aaden/readFiles/readFiles"
import {addAttribute,updateAttribute,getAttribute,hashAttributeName,hashAttributeWithFiles,hashAttributeWithSystem} from "../../store/aaden/readFiles/Attribute"
import {getAttributeGroup} from "../../store/aaden/readFiles/AttributeGroup"
import {getNgrokPHPUrl} from "../../store/aaden/utils"


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
      fileData.value = await parseCsv(file.value)
    } else if (fileType === 'xlsx') {
      fileData.value = await parseExcel(file.value)
    } else {
      IKUtils.showError('File Type is not csv or xlsx')
    }
    fileData.value = fileData.value.filter(it => it.code)
    console.log(fileData.value, 'fileData')
    await uploadPrepare(fileData.value)
    loading.value  = false
  }
}

async function uploadPrepare(rawFileData) {
  log.value = []
  // 使用deviceId构建URL
  currentUrl.value = getNgrokPHPUrl(deviceId.value)
  rawFileData.forEach((dish, index) => {
    // 检查每个dish对象的所有属性值是否包含逗号，除了desc字段
    for (const [key, value] of Object.entries(dish)) {
      if (key !== 'desc' && value && typeof value === 'string' && value.includes(',')) {
        log.value.push({
          index: index + 2,
          value: key,
          reason: '该处含有 , 请更换其他符号！'
        })
      }
    }
  })
  if (log.value.length === 0) {
    await uploadAttribute(currentUrl.value, rawFileData)
    step.value = '文件上传完毕！' + step.value
  } else {
    step.value = '文件有问题,结束上传' + `<br>` + step.value
  }
}

async function uploadAttribute (url, rawFileData) {
  step.value = '开始上传Attribute' + `<br>` + step.value
  const attributeDict = (await getAttribute(url))
  const attributeGroupDict = await getAttributeGroup(url)
  let hashByFiles = ''
  let hashBySystem = ''
  const addAttributeReqs = []
  const updateAttributeReqs = []
  const allAddResults = []
  const allUpdateResults = []
  console.log(attributeDict,'dict')
  for (const item of rawFileData) {
    const isOld = attributeDict.find(it => Array.isArray(it.langs) && it.langs.some(lang => lang?.name === item.nameZH))
    const fileAttributeGroupId = attributeGroupDict.find(a => Array.isArray(a.langs) && a.langs.some(b => b?.name === item.attributeGroupName))?.id
    if (isOld) {
      if (fileAttributeGroupId.toString() !== isOld.attributeGroupId) {
        const newAttribute = {
          image: '',
          langs: [
            {
              desc: item.descDE,
              lang: 'DE',
              name: item.nameDE
            },
            {
              desc: item.descZH,
              lang: 'ZH',
              name: item.nameZH
            },
            {
              desc: item.descEN,
              lang: 'EN',
              name: item.nameEN
            }
          ],
          priceMod: item.priceMod,
          attributeGroupId: fileAttributeGroupId,
          value: item.sort,
          dishesCategoryTypeId: item.dishesCategoryTypeId,
          frontendHide: item.frontendHide === '1',
          useTeaMaker: item.useTeaMaker,
          teaMakerCode: item.teaMakerCode ?? '',
          instructions: item.instructions ?? '',
          isActive: item.isActive,
        }
        addAttributeReqs.push(addAttribute(url, newAttribute))
      } else {
        hashByFiles = hashAttributeWithFiles(item)
        hashBySystem = hashAttributeWithSystem(isOld)
        console.log(hashBySystem,hashByFiles, 'hashBySystem')
        if (hashByFiles !== hashBySystem) {
          step.value = item.nameZH + '系统已经存在,正在更新' + `<br>` + step.value
          const oldAttribute = IKUtils.deepCopy(isOld)
          oldAttribute.priceMod = item.priceMod
          oldAttribute.value = item.sort
          oldAttribute.dishesCategoryTypeId = item.dishesCategoryTypeId
          oldAttribute.frontendHide = item.frontendHide.toString() === '1'
          oldAttribute.useTeaMaker = item.useTeaMaker
          oldAttribute.teaMakerCode = item.teaMakerCode ?? ''
          oldAttribute.instruction = item.instructions ?? ''
          oldAttribute.isActive = item.isActive.toString() === '1'
          updateAttributeReqs.push(updateAttribute(url, oldAttribute))
        }
      }
    } else {
      const newAttribute = {
        image: '',
        langs: [
          {
            desc: item.descDE,
            lang: 'DE',
            name: item.nameDE
          },
          {
            desc: item.descZH,
            lang: 'ZH',
            name: item.nameZH
          },
          {
            desc: item.descEN,
            lang: 'EN',
            name: item.nameEN
          }
        ],
        priceMod: item.priceMod,
        attributeGroupId: fileAttributeGroupId,
        value: item.sort,
        dishesCategoryTypeId: item.dishesCategoryTypeId,
        frontendHide: item.frontendHide.toString() === '1',
        useTeaMaker: item.useTeaMaker,
        teaMakerCode: item.teaMakerCode,
        instructions: item.instructions,
        isActive: item.isActive.toString() === '1'
      }
      addAttributeReqs.push(addAttribute(url, newAttribute))
    }
    if (addAttributeReqs.length === 30) {
      step.value = '执行一批30个属性新增请求' + `<br>` + step.value
      try {
        const batchResults = await Promise.all(addAttributeReqs)
        allAddResults.push(...batchResults)
        step.value = '完成一批30个属性新增请求' + `<br>` + step.value
      } catch (error) {
        console.error('新增产品批次请求失败:', error)
        throw error
      }
      // 清空数组，准备下一批
      addAttributeReqs.length = 0
    }
    if (updateAttributeReqs.length === 30) {
      step.value = '执行一批30个属性组更新请求' + `<br>` + step.value
      try {
        const batchResults = await Promise.all(updateAttributeReqs)
        allUpdateResults.push(...batchResults)
        step.value = '完成一批30个属性组更新请求' + `<br>` + step.value
      } catch (error) {
        console.error('更新产品批次请求失败:', error)
        throw error
      }
      // 清空数组，准备下一批
      updateAttributeReqs.length = 0
    }
  }
  try {
    // 处理剩余的updateDishReqs
    if (updateAttributeReqs.length > 0) {
      step.value = '开始处理剩余的属性组更新请求' + `<br>` + step.value
      const remainingResults = await batchRequests(updateAttributeReqs, 5)
      allUpdateResults.push(...remainingResults)
      step.value = '结束处理剩余的属性组更新请求' + `<br>` + step.value
    }

    // 处理剩余的addDishReqs
    if (addAttributeReqs.length > 0) {
      step.value = '开始处理剩余的属性组新增请求' + `<br>` + step.value
      const remainingResults = await batchRequests(addAttributeReqs, 5)
      allAddResults.push(...remainingResults)
      step.value = '结束处理剩余的属性组新增请求' + `<br>` + step.value
    }
  } catch (e) {
    console.log(e, 'attributeGroup相关')
  }
  console.log(attributeDict, 'attributeDict')
}

async function batchRequests(requests, batchSize = 5) {
  const results = [];

  // 按批次处理
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    console.log(`开始第 ${Math.floor(i / batchSize) + 1} 批请求，数量: ${batch.length}`);

    try {
      // 执行当前批次的所有请求
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      console.log(`第 ${Math.floor(i / batchSize) + 1} 批请求完成`);
    } catch (error) {
      console.error(`第 ${Math.floor(i / batchSize) + 1} 批请求失败:`, error);
      // 可以根据需要决定是否继续
      throw error;
    }
  }

  return results;
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
    <n-card title="菜品属性上传">
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
