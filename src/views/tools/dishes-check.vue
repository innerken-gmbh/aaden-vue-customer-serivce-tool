<script setup lang="ts">
import {ref, h} from "vue";
import IKUtils from "innerken-js-utils";
import {parseCsv, parseExcel, hashCodeByCompare, hashCodeWithSystem} from "../../store/aaden/readFiles/readFiles"
import {getDishCodeList, addDish, updateDish} from "../../store/aaden/readFiles/dish"
import {loadPrinterGroup} from "../../store/aaden/readFiles/print"
import {getCategoryNameByZHDEEN, addCategory, getCategory} from "../../store/aaden/readFiles/category"
import {getNgrokPHPUrl} from "../../store/aaden/utils"
import {groupBy, uniqBy} from "lodash-es";


const file = ref(null);
const fileData = ref([]);
const loading = ref(false);
const currentUrl = ref('')
const deviceId = ref('')
const log = ref([])
const step = ref('')

// 定义数据检查日志表格的列
const logColumns = [
  {title: 'index', key: 'index'},
  {title: 'value', key: 'value'},
  {title: 'reason', key: 'reason'}
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
    await uploadPrepare(fileData.value)
    loading.value = false
  }
}

async function uploadPrepare(rawFileData) {
  log.value = []
  // 使用deviceId构建URL
  currentUrl.value = getNgrokPHPUrl(deviceId.value)
  const priceCheck = /(^[0-9]\d*(\.\d{1,2})?$)/
  const appearOnce = {}
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
    if (!priceCheck.test(dish.price)) {
      log.value.push({
        index: index + 2,
        value: 'Price',
        reason: '价格只能填写数字,小数点,且最多2位小数'
      })
    }

    // 检查code值是否重复
    if (dish.code) {
      // 转换为小写进行比较，实现不区分大小写
      const lowerCaseCode = dish.code.toLowerCase();
      if (appearOnce[lowerCaseCode]) {
        // 如果code已经出现过，添加到log中
        log.value.push({
          index: index + 2,
          value: 'Code',
          reason: `${dish.code} 重复，已在第 ${appearOnce[lowerCaseCode]} 行出现过`
        })
      } else {
        // 记录code首次出现的行号
        appearOnce[lowerCaseCode] = index + 2
      }
    }
  })
  await getFilesInfoBySystem(currentUrl.value, rawFileData)
}

async function getFilesInfoBySystem(url, rawFileData) {
  console.log(url, 'url')
  const allList = (await getDishCodeList(url))
  const categoryDict = (await getCategory(url))
  let systemList = []

  // Check for items in rawFileData that don't exist in the system
  for (const fileItem of rawFileData) {
    const systemDish = allList.list.find(x => x.code.toLowerCase() === fileItem.code.toLowerCase())

    if (!systemDish) {
      // Item doesn't exist in the system
      log.value.push({
        index: rawFileData.indexOf(fileItem) + 2,
        value: fileItem.code,
        reason: '系统中不存在此菜品代码'
      })
      continue
    }

    const currentCategory = categoryDict.find(category => category.id === systemDish.categoryId)
    if (!currentCategory) {
      log.value.push({
        index: rawFileData.indexOf(fileItem) + 2,
        value: fileItem.code,
        reason: '系统中找不到对应的分类'
      })
      continue
    }

    const obj = {
      code: systemDish.code,
      nameZH: systemDish.langs.find(lang => lang.lang === 'ZH')?.name || '',
      nameDE: systemDish.langs.find(lang => lang.lang === 'DE')?.name || '',
      nameEN: systemDish.langs.find(lang => lang.lang === 'EN')?.name || '',
      price: systemDish.price,
      printCatId: systemDish.printGroupId,
      isActive: systemDish.isActive,
      catNameZH: currentCategory.langs.find(lang => lang.lang === 'ZH')?.name || '',
      catNameDE: currentCategory.langs.find(lang => lang.lang === 'DE')?.name || '',
      catNameEN: currentCategory.langs.find(lang => lang.lang === 'EN')?.name || '',
      catTypeId: currentCategory.dishesCategoryTypeId,
      keyInstruction: systemDish.keyInstruction
    }
    systemList.push(obj)

    // Compare file data with system data
    const fileItemHash = hashCodeByCompare(fileItem)

    const systemItemHash = hashCodeByCompare(obj)

    if (fileItemHash !== systemItemHash) {
      // Find which fields are different
      const differences = []

      if ((fileItem.nameZH || '').toLowerCase() !== (obj.nameZH || '').toLowerCase()) {
        differences.push('nameZH')
      }
      if ((fileItem.nameDE || '').toLowerCase() !== (obj.nameDE || '').toLowerCase()) {
        differences.push('nameDE')
      }
      if ((fileItem.nameEN || '').toLowerCase() !== (obj.nameEN || '').toLowerCase()) {
        differences.push('nameEN')
      }
      if (parseFloat(fileItem.price || 0).toFixed(2) !== parseFloat(obj.price || 0).toFixed(2)) {
        differences.push('price')
      }
      if ((fileItem.catTypeId || '10') !== (obj.catTypeId || '10').toString()) {
        differences.push('catTypeId')
      }
      if ((fileItem.catNameZH || '').toLowerCase() !== (obj.catNameZH || '').toLowerCase()) {
        differences.push('catNameZH')
      }
      if ((fileItem.catNameDE || '').toLowerCase() !== (obj.catNameDE || '').toLowerCase()) {
        differences.push('catNameDE')
      }
      if ((fileItem.catNameEN || '').toLowerCase() !== (obj.catNameEN || '').toLowerCase()) {
        differences.push('catNameEN')
      }
      if (fileItem.keyInstruction !== obj.keyInstruction) {
        differences.push('keyInstruction')
      }
      if (fileItem.printCatId !== obj.printCatId) {
        differences.push('printCatId')
      }
      if (fileItem.isActive !== obj.isActive) {
        differences.push('isActive')
      }

      if (differences.length > 0) {
        log.value.push({
          index: rawFileData.indexOf(fileItem) + 2,
          value: fileItem.code,
          reason: '与系统数据不同: ' + differences.join(', ')
        })
      }
    }
  }
  if (log.value.length > 0) {
    step.value = '发现数据差异，请查看日志' + `<br>` + step.value
  } else {
    step.value = '数据校验完成，未发现差异' + `<br>` + step.value
  }
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
    <n-card title="菜品CSV检测">
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
