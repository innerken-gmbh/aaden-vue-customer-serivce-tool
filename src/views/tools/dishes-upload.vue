<script setup lang="ts">
import { ref, h } from "vue";
import IKUtils from "innerken-js-utils";
import {parseCsv,parseExcel, hashCodeWithFiles,hashCodeWithSystem} from "../../store/aaden/readFiles/readFiles"
import {getDishCodeList,addDish,updateDish} from "../../store/aaden/readFiles/dish"
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
  if (log.value.length === 0) {
    await uploadCategory(currentUrl.value, rawFileData)
    await uploadDish(currentUrl.value, rawFileData)
    step.value = '文件上传完毕！' + step.value
  } else {
    step.value = '文件有问题,结束上传' + `<br>` + step.value
  }
}

async function uploadCategory(url, rawFileData) {
  step.value = '开始上传Category' + `<br>` + step.value
  const categoryNameDict = (await getCategoryNameByZHDEEN(url))
  const categoryReqs = []
  // Track unique category combinations that have been added to categoryReqs
  const addedCategories = new Set()

  for (const dish of rawFileData) {
    const categoryName = dish.catNameZH.toLowerCase() + dish.catNameDE.toLowerCase() + dish.catNameEN.toLowerCase()
    if(categoryNameDict.includes(categoryName)){
      console.log(categoryName + '已存在')
    } else {
      // Create a unique key for this category combination
      const categoryKey = `${dish.catNameZH.toLowerCase()}_${dish.catNameDE.toLowerCase()}_${dish.catNameEN.toLowerCase()}_${dish.catTypeId}`

      // Only add if this category combination hasn't been added yet
      if (!addedCategories.has(categoryKey)) {
        step.value = '准备新建category:' + dish.catNameZH + `<br>` + step.value
        categoryReqs.push(addCategory(url,{
          langs: [
            {
              desc: '',
              lang: 'de',
              name: dish.catNameDE
            },
            {
              desc: '',
              lang: 'zh',
              name: dish.catNameZH
            },
            {
              desc: '',
              lang: 'en',
              name: dish.catNameEN
            }
          ],
          catTypeId: dish.catTypeId,
        }))

        // Mark this category combination as added
        addedCategories.add(categoryKey)
      }
    }
  }
  try {
    step.value = '开始新建category' + `<br>` + step.value
    await Promise.all(categoryReqs)
    step.value = '新建category结束' + `<br>` + step.value
  } catch (e) {
    console.log(e, '新建category')
  }
}

async function uploadDish(url, rawFileData) {
  step.value = '开始检查产品信息' + `<br>` + step.value
  const categoryDict = (await getCategory(url))
  const allList = (await getDishCodeList(url))
  const dishCodeDict = allList.codeList
  const dishList = allList.list
  for (const dish of rawFileData) {
    if (dishCodeDict.includes(dish.code.toLowerCase())) {
      const currentDish = dishList.find(it => it.code.toLowerCase() === dish.code.toLowerCase())
      const hashCodeByFiles = hashCodeWithFiles(dish)
      const hashCodeBySystem = hashCodeWithSystem(currentDish)
      if (hashCodeByFiles !== hashCodeBySystem) {
        step.value = dish.nameZH + '系统已经存在,正在更新' + `<br>` + step.value
        currentDish.price = dish.price
        currentDish.langs = [
          {
            desc: dish.desc ? dish.desc : dish.descDE ?? '',
            lang: 'de',
            name: dish.nameDE
          },
          {
            desc: dish.desc ? dish.desc : dish.descZH ?? '',
            lang: 'zh',
            name: dish.nameZH
          },
          {
            desc: dish.desc ? dish.desc : dish.descEN ?? '',
            lang: 'en',
            name: dish.nameEN
          }
        ]
        currentDish.printGroupId = dish.printCatId
        currentDish.categoryId = categoryDict.find(it => it.langs.find(x => x.lang === 'ZH').name.toLowerCase() === dish.catNameZH.toLowerCase())?.id ?? currentDish.categoryId
        await updateDish(url, currentDish)
      } else {
        step.value = dish.nameZH + '系统已经存在,无需更新' + `<br>` + step.value
      }
    } else {
      step.value = '正在新建产品' + dish.nameZH + `<br>` + step.value
      const newDish = {
        code: dish.code,
        color: '#ffffff',
        price: dish.price,
        image: '',
        langs: [
          {
            desc: dish.descDE ?? '',
            lang: 'de',
            name: dish.nameDE
          },
          {
            desc: dish.descZH ?? '',
            lang: 'zh',
            name: dish.nameZH
          },
          {
            desc: dish.descEN ?? '',
            lang: 'en',
            name: dish.nameEN
          }
        ],
        printGroupId: dish.printCatId,
        categoryId: categoryDict.find(it => it.langs.find(x => x.lang === 'ZH').name.toLowerCase() === dish.catNameZH.toLowerCase())?.id ?? ''
      }
      await addDish(url, newDish)
    }
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
    <n-card title="菜品数据上传">
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
