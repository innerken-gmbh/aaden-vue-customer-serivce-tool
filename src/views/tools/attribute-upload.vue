<script setup lang="ts">
import { ref, h } from "vue";
import IKUtils from "innerken-js-utils";
import {parseCsv,parseExcel, hashCodeWithFiles,hashCodeWithSystem} from "../../store/aaden/readFiles/readFiles"
import {addAttribute,updateAttribute,getAttribute,hashAttributeName,hashAttributeWithFiles,hashAttributeWithSystem} from "../../store/aaden/readFiles/Attribute"
import {addAttributeGroup,hashAttributeGroupValue,getErrorKey,updateAttributeGroup,getAttributeGroup,hashAttributeGroupWithFiles,hashAttributeGroupWithSystem} from "../../store/aaden/readFiles/AttributeGroup"

import {getNgrokPHPUrl} from "../../store/aaden/utils"
import {uniqBy} from "lodash-es";


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
    console.log(fileData.value, 'fileData')
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

const allFilesAttributeGroup = ref([])

const filesWithGroupId = ref([])

function checkFilesAttributeGroupLog (rawFileData) {
  for (const [idx, item] of rawFileData.entries()) {
    const value = hashAttributeGroupValue(item);
    const existed = allFilesAttributeGroup.value.find((ag) => ag.name === item.agNameDE);
    if (existed && existed.value !== value) {
      const diffIndexes = value.split('-').reduce((indexes, item, idx) => {
        if (item !== existed.value.split('-')[idx]) indexes.push(idx);
        return indexes;
      }, []);
      const errorKeys = getErrorKey(diffIndexes);
      // 现在可以使用 idx 输出具体是哪一行数据出错
      for (const key of errorKeys) {
        log.value.push({
          index: idx + 2,
          value: key,
          reason: `与第 ${existed.index + 2} 行相比，agNameDE相同的行，${key}必须保持一致！`
        })
      }
      return;
    }
    if (!existed) {
      allFilesAttributeGroup.value.unshift({
        name: item.agNameDE,
        nameZH: item.agNameZH ? item.agNameZH : item.agNameDE,
        nameEN: item.agNameEN ? item.agNameEN : item.agNameDE,
        value,
        index: idx,
        required: item.agRequired,
        multiSelect: item.agMultiSelect,
        isActive: item.agIsActive,
        asTeaMakerAttribute: item.agAsTeaMakerAttribute,
      });
    } else {
      existed.index = idx
    }
  }
}

function checkFilesAttributeLog (rawFileData) {
  // 检查 rawFileData 中 aNameDE 是否存在重复。如果发现重复，
  // 在 log 中分别记录这两条数据的行号（索引+2，对应表格中的真实行号），然后立即返回。
  const seenIndexMap = new Map(); // aNameDE -> first index
  for (const [idx, item] of rawFileData.entries()) {
    const name = item?.aNameDE?.toString()?.trim();
    if (!name) continue;
    if (seenIndexMap.has(name)) {
      const firstIdx = seenIndexMap.get(name);
      // 为首次出现和当前重复项各写一条日志
      log.value.push({
        index: firstIdx + 2,
        value: rawFileData[firstIdx]?.aNameDE ?? name,
        reason: `与第 ${idx + 2} 行相比，aNameDE重复！`
      });
      log.value.push({
        index: idx + 2,
        value: name,
        reason: `与第 ${firstIdx + 2} 行相比，aNameDE重复！`
      });
      return; // 发现第一组重复后立刻返回
    } else {
      seenIndexMap.set(name, idx);
    }
  }
}

async function uploadAttributeGroup (url,attributeGroupDict) {
  step.value = '开始上传AttributeGroup' + `<br>` + step.value
  let hashByFiles = ''
  let hashBySystem = ''
  const addAttributeGroupReqs = []
  const updateAttributeGroupReqs = []
  const allAddResults = []
  const allUpdateResults = []
  for (const item of allFilesAttributeGroup.value) {
    const isOld = attributeGroupDict.find(it => Array.isArray(it.langs) && it.langs.some(lang => lang?.name === item.name))
    if (isOld) {
      hashByFiles = hashAttributeGroupWithFiles(item)
      hashBySystem = hashAttributeGroupWithSystem(isOld)
      if (hashByFiles !== hashBySystem) {
        step.value = item.name + '系统已经存在,正在更新' + `<br>` + step.value
        const oldAttributeGroup = IKUtils.deepCopy(isOld)
        oldAttributeGroup.required = item.required
        oldAttributeGroup.multiSelect = item.multiSelect
        oldAttributeGroup.asTeaMakerAttribute = item.asTeaMakerAttribute
        oldAttributeGroup.isActive =  item.isActive
        updateAttributeGroupReqs.push(updateAttributeGroup(url, oldAttributeGroup))
        if (updateAttributeGroupReqs.length === 30) {
          step.value = '执行一批30个属性组更新请求' + `<br>` + step.value
          try {
            const batchResults = await Promise.all(updateAttributeGroupReqs)
            allUpdateResults.push(...batchResults)
            step.value = '完成一批30个属性组更新请求' + `<br>` + step.value
          } catch (error) {
            console.error('更新产品批次请求失败:', error)
            throw error
          }
          // 清空数组，准备下一批
          updateAttributeGroupReqs.length = 0
        }
      }
    } else {
      const newAttributeGroup = {
        printTitle: '',
        name: '',
        langs: [
          {
            lang: 'DE',
            name: item.name
          },
          {
            lang: 'ZH',
            name: item.nameZH
          },
          {
            lang: 'EN',
            name: item.nameEN
          }
        ],
        required: item.required,
        multiSelect: item.multiSelect,
        isActive: item.isActive,
        maxCount: -1,
        asTeamakerAttribute: item.asTeaMakerAttribute,
        asShuTuoUnit: 0
      }
      addAttributeGroupReqs.push(addAttributeGroup(url, newAttributeGroup))
      if (addAttributeGroupReqs.length === 30) {
        step.value = '执行一批30个属性组新增请求' + `<br>` + step.value
        try {
          const batchResults = await Promise.all(addAttributeGroupReqs)
          allAddResults.push(...batchResults)
          step.value = '完成一批30个属性组新增请求' + `<br>` + step.value
        } catch (error) {
          console.error('新增产品批次请求失败:', error)
          throw error
        }
        // 清空数组，准备下一批
        addAttributeGroupReqs.length = 0
      }
    }
  }
  try {
    if (updateAttributeGroupReqs.length > 0) {
      step.value = '开始处理剩余的属性组更新请求' + `<br>` + step.value
      const remainingResults = await batchRequests(updateAttributeGroupReqs, 5)
      allUpdateResults.push(...remainingResults)
      step.value = '结束处理剩余的属性组更新请求' + `<br>` + step.value
    }

    if (addAttributeGroupReqs.length > 0) {
      step.value = '开始处理剩余的属性组新增请求' + `<br>` + step.value
      const remainingResults = await batchRequests(addAttributeGroupReqs, 5)
      allAddResults.push(...remainingResults)
      step.value = '结束处理剩余的属性组新增请求' + `<br>` + step.value
    }
  } catch (e) {
    console.log(e, 'attributeGroup相关')
  }
}

async function getAttributeGroupId (url,rawFileData) {
  const attributeGroupDict = (await getAttributeGroup(url))
  // 先把系统中的 attributeGroupId 映射到 allFilesAttributeGroup 中（按名称匹配）
  allFilesAttributeGroup.value.forEach((file) => {
    file.attributeGroupId = attributeGroupDict.find(it => Array.isArray(it.langs) && it.langs.some(lang => lang?.name === file.name))?.id
  })
  // 再把 attributeGroupId 写回到原始的 rawFileData 中（按 agNameDE 与文件中的分组名匹配）
  if (Array.isArray(rawFileData)) {
    for (const row of rawFileData) {
      const matched = allFilesAttributeGroup.value.find(ag => ag.name === row.agNameDE)
      if (matched && matched.attributeGroupId) {
        row.attributeGroupId = matched.attributeGroupId
      }
    }
  }
  filesWithGroupId.value = rawFileData
  console.log(filesWithGroupId.value, 'filesWithGroupId')
}

async function uploadAll (url, rawFileData) {
  step.value = '开始上传Attribute' + `<br>` + step.value
  checkFilesAttributeGroupLog(rawFileData)
  checkFilesAttributeLog(rawFileData)
  const attributeGroupDict = (await getAttributeGroup(url))
  await uploadAttributeGroup(url, attributeGroupDict)
  await getAttributeGroupId(url,rawFileData)
  await uploadAttribute(url)
}

async function uploadAttribute (url) {
  step.value = '开始上传Attribute' + `<br>` + step.value
  const attributeDict = (await getAttribute(url))
  let hashByFiles = ''
  let hashBySystem = ''
  const addAttributeReqs = []
  const updateAttributeReqs = []
  const allAddResults = []
  const allUpdateResults = []
  for (const item of filesWithGroupId.value) {
    const isOld = attributeDict.find(it => Array.isArray(it.langs) && it.langs.some(lang => lang?.name === item.aNameDE))
    if (isOld) {
      if (item.attributeGroupId !== isOld.attributeGroupId) {
        const newAttribute = {
          image: '',
          langs: [
            {
              desc: item.aDescDE ?? '',
              lang: 'DE',
              name: item.aNameDE
            },
            {
              desc: item.aDescZH ? item.aDescZH : (item.aDescDE ? item.aDescDE : ''),
              lang: 'ZH',
              name: item.nameZH ? item.aNameZH : item.aNameDE
            },
            {
              desc: item.aDescEN ? item.aDescEN : (item.aDescDE ? item.aDescDE : ''),
              lang: 'EN',
              name: item.nameEN ? item.aNameEN : item.aNameDE
            }
          ],
          priceMod: item.aPriceMod,
          attributeGroupId: item.attributeGroupId,
          value: item.aSort ? item.aSort : 1,
          dishesCategoryTypeId: item.aDishesCategoryTypeId,
          frontendHide: item.aFrontendHide === '1',
          useTeaMaker: item.aUseTeaMaker,
          teaMakerCode: item.aTeaMakerCode ?? '',
          instructions: item.aInstructions ?? '',
          isActive: item.aIsActive,
        }
        addAttributeReqs.push(addAttribute(url, newAttribute))
      } else {
        hashByFiles = hashAttributeWithFiles(item)
        hashBySystem = hashAttributeWithSystem(isOld)
        console.log(hashBySystem,hashByFiles, 'hashBySystem')
        if (hashByFiles !== hashBySystem) {
          step.value = item.nameZH + '系统已经存在,正在更新' + `<br>` + step.value
          const oldAttribute = IKUtils.deepCopy(isOld)
          oldAttribute.priceMod = item.aPriceMod
          oldAttribute.value = item.aSort
          oldAttribute.dishesCategoryTypeId = item.aDishesCategoryTypeId
          oldAttribute.frontendHide = item.aFrontendHide.toString() === '1'
          oldAttribute.useTeaMaker = item.aUseTeaMaker
          oldAttribute.teaMakerCode = item.aTeaMakerCode ?? ''
          oldAttribute.instruction = item.aInstructions ?? ''
          oldAttribute.isActive = item.aIsActive.toString() === '1'
          updateAttributeReqs.push(updateAttribute(url, oldAttribute))
        }
      }
    } else {
      const newAttribute = {
        image: '',
        langs: [
          {
            desc: item.aDescDE ?? '',
            lang: 'DE',
            name: item.aNameDE
          },
          {
            desc: item.aDescZH ? item.aDescZH : (item.aDescDE ? item.aDescDE : ''),
            lang: 'ZH',
            name: item.nameZH ? item.aNameZH : item.aNameDE
          },
          {
            desc: item.aDescEN ? item.aDescEN : (item.aDescDE ? item.aDescDE : ''),
            lang: 'EN',
            name: item.nameEN ? item.aNameEN : item.aNameDE
          }
        ],
        priceMod: item.aPriceMod,
        attributeGroupId: item.attributeGroupId,
        value: item.aSort ? item.aSort : 1,
        dishesCategoryTypeId: item.aDishesCategoryTypeId,
        frontendHide: item.aFrontendHide === '1',
        useTeaMaker: item.aUseTeaMaker,
        teaMakerCode: item.aTeaMakerCode ?? '',
        instructions: item.aInstructions ?? '',
        isActive: item.aIsActive,
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
