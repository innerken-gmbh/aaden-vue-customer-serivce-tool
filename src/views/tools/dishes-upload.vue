<script setup lang="ts">
import {ref, h, watch} from "vue";
import DeviceIdSelector from "@/views/components/common/DeviceIdSelector.vue";
import IKUtils from "innerken-js-utils";
import {
  parseCsv,
  parseExcel,
  hashCodeWithFiles,
  hashCodeWithSystem,
  detectChineseEncoding,
} from "../../store/aaden/readFiles/readFiles";
import {
  getDishCodeList,
  addDish,
  updateDish,
} from "../../store/aaden/readFiles/dish";
import {
  getCategoryNameByZHDEEN,
  addCategory,
  getCategory,
} from "../../store/aaden/readFiles/category";
import {getNgrokPHPUrl,isNgrokEnabled} from "../../store/aaden/utils";

const file = ref(null);
const fileData = ref([]);
const loading = ref(false);
const currentUrl = ref("");
const deviceIds = ref([]);
const log = ref([]);
const step = ref(""); // 保留但不再使用
const currentStep = ref(0);
const uploadStatus = ref("process");
const stepLog = ref([]); // 存储每个设备的进度 [{ deviceId, step }]

// 数据检查日志表格列
const logColumns = [
  {title: "index", key: "index"},
  {title: "value", key: "value"},
  {title: "reason", key: "reason"},
];

function stepLogDisplay (log) {
  if (log) {
    return log.split('<br>').reverse().join('<br>');
  } else {
    return ''
  }
}

async function handleFileUpload() {
  if (deviceIds.value.length === 0) {
    IKUtils.showError("请先填写设备ID");
    return;
  }

  for (const device of deviceIds.value) {
    const checkStatus = await isNgrokEnabled(device);
    if (!checkStatus) {
      IKUtils.showError(device + ',这个设备ngrok没开！')
      return
    }
  }
  if (file.value) {
    stepLog.value = []; // 重置
    loading.value = true;
    const fileType = file.value.name.split(".").pop()?.toLowerCase();
    if (fileType === "csv") {
      const encodingType = (await detectChineseEncoding(file.value as any))
          .encoding;
      if (encodingType !== "UTF-8") {
        IKUtils.showError("请使用UTF-8格式的csv");
        loading.value = false;
        return;
      }
      fileData.value = await parseCsv(file.value);
    } else if (fileType === "xlsx") {
      fileData.value = await parseExcel(file.value);
    } else {
      IKUtils.showError("File Type is not csv or xlsx");
    }
    fileData.value = fileData.value.filter((it) => it.code);
    try {
      currentStep.value = 0;
      uploadStatus.value = "process";
      for (let i = 0; i < deviceIds.value.length; i++) {
        const id = deviceIds.value[i];
        currentStep.value = i;
        // 初始化该设备的进度
        stepLog.value.push({deviceId: id, step: "开始处理设备...<br>"});
        await uploadPrepare(fileData.value, id);
      }
      currentStep.value = deviceIds.value.length;
    } catch (e) {
      console.log(e, "error");
      uploadStatus.value = "error";
    }
    loading.value = false;
  }
}

async function uploadPrepare(rawFileData, id) {
  // 获取当前设备的进度对象
  const stepItem = stepLog.value.find((item) => item.deviceId === id);
  if (!stepItem) return;

  // 更新当前设备步骤的函数
  const updateStep = (msg: string) => {
    stepItem.step += msg + "<br>";
  };

  log.value = [];
  // 使用deviceId构建URL
  currentUrl.value = getNgrokPHPUrl(id);
  const priceCheck = /(^[0-9]\d*(\.\d{1,2})?$)/;
  const appearOnce = {};
  rawFileData.forEach((dish, index) => {
    // 检查每个dish对象的所有属性值是否包含逗号，除了desc字段
    for (const [key, value] of Object.entries(dish)) {
      if (key !== "desc" && value && typeof value === "string" && value.includes(",")) {
        log.value.push({
          index: index + 2,
          value: key,
          reason: "该处含有 , 请更换其他符号！",
        });
      }
    }
    if (!priceCheck.test(dish.price)) {
      log.value.push({
        index: index + 2,
        value: "Price",
        reason: "价格只能填写数字,小数点,且最多2位小数",
      });
    }

    // 检查code值是否重复
    if (dish.code) {
      const lowerCaseCode = dish.code.toLowerCase();
      if (appearOnce[lowerCaseCode]) {
        log.value.push({
          index: index + 2,
          value: "Code",
          reason: `${dish.code} 重复，已在第 ${appearOnce[lowerCaseCode]} 行出现过`,
        });
      } else {
        appearOnce[lowerCaseCode] = index + 2;
      }
    }
  });

  if (log.value.length === 0) {
    updateStep("文件校验通过，开始上传分类...");
    await uploadCategory(currentUrl.value, rawFileData, updateStep);
    updateStep("分类上传完成，开始上传产品...");
    await uploadDish(currentUrl.value, rawFileData, updateStep);
    updateStep("文件上传完毕！");
  } else {
    updateStep("文件有问题，结束上传");
  }
}

async function uploadCategory(url, rawFileData, onStep) {
  onStep("开始获取现有分类...");
  const categoryNameDict = await getCategoryNameByZHDEEN(url);
  const categoryReqs = [];
  const addedCategories = new Set();

  for (const dish of rawFileData) {
    const categoryName =
        dish.catNameZH.toLowerCase() +
        dish.catNameDE.toLowerCase() +
        dish.catNameEN.toLowerCase() +
        dish.catTypeId;
    if (categoryNameDict.includes(categoryName)) {
      // 已存在，跳过
    } else {
      const categoryKey =
          `${dish.catNameZH.toLowerCase()}_${dish.catNameDE.toLowerCase()}_${dish.catNameEN.toLowerCase()}_${dish.catTypeId}`;
      if (!addedCategories.has(categoryKey)) {
        onStep(`准备新建分类: ${dish.catNameZH}`);
        categoryReqs.push(
            addCategory(url, {
              langs: [
                {desc: "", lang: "DE", name: dish.catNameDE},
                {desc: "", lang: "ZH", name: dish.catNameZH},
                {desc: "", lang: "EN", name: dish.catNameEN},
              ],
              catTypeId: dish.catTypeId,
            })
        );
        addedCategories.add(categoryKey);
      }
    }
  }

  if (categoryReqs.length > 0) {
    onStep(`开始批量创建 ${categoryReqs.length} 个分类...`);
    try {
      await Promise.all(categoryReqs);
      onStep("分类创建完成");
    } catch (e) {
      onStep("分类创建出错: " + e.message);
      console.log(e, "新建category");
    }
  } else {
    onStep("没有需要新建的分类");
  }
}

async function uploadDish(url, rawFileData, onStep) {
  onStep("开始检查产品信息...");
  const categoryDict = await getCategory(url);
  const allList = await getDishCodeList(url);
  const dishCodeDict = allList.codeList;
  const dishList = allList.list;
  const addDishReqs = [];
  const updateDishReqs = [];
  const allUpdateResults = [];
  const allAddResults = [];

  for (const dish of rawFileData) {
    if (dishCodeDict.includes(dish.code.toLowerCase())) {
      const currentDish = dishList.find(
          (it) => it.code.toLowerCase() === dish.code.toLowerCase()
      );
      let hashCodeByFiles = "";
      let hashCodeBySystem = "";
      const hasIsActive = dish.isActive !== undefined && dish.isActive !== null;
      const keyInstruction =
          dish.keyInstruction !== undefined && dish.keyInstruction !== null;
      const dishesCategoryTypeId =
          categoryDict.find(
              (it) => it?.id?.toString() === currentDish?.categoryId?.toString()
          )?.dishesCategoryTypeId ?? "";
      hashCodeByFiles = hashCodeWithFiles(dish, hasIsActive, keyInstruction);
      hashCodeBySystem = hashCodeWithSystem(
          currentDish,
          hasIsActive,
          keyInstruction,
          dishesCategoryTypeId
      );
      if (hashCodeByFiles !== hashCodeBySystem) {
        onStep(`${dish.nameZH} 系统已存在，正在更新...`);
        currentDish.price = dish.price;
        currentDish.langs = [
          {
            desc: dish.desc ? dish.desc : dish.descDE ?? "",
            lang: "DE",
            name: dish.nameDE,
          },
          {
            desc: dish.desc ? dish.desc : dish.descZH ?? "",
            lang: "ZH",
            name: dish.nameZH,
          },
          {
            desc: dish.desc ? dish.desc : dish.descEN ?? "",
            lang: "EN",
            name: dish.nameEN,
          },
        ];
        currentDish.isActive = dish.isActive ? dish.isActive : currentDish.isActive;
        currentDish.keyInstruction = dish.keyInstruction
            ? dish.keyInstruction
            : currentDish.keyInstruction;
        currentDish.printGroupId = dish.printCatId;
        currentDish.categoryId =
            categoryDict
                .filter(
                    (it) =>
                        it.langs.find((x) => x.lang === "ZH").name.toLowerCase() ===
                        dish.catNameZH.toLowerCase()
                )
                .find((it) => it.dishesCategoryTypeId === dish.catTypeId)?.id ??
            currentDish.categoryId;
        updateDishReqs.push(updateDish(url, currentDish));

        if (updateDishReqs.length === 30) {
          onStep("执行一批30个产品更新请求");
          try {
            const batchResults = await Promise.all(updateDishReqs);
            allUpdateResults.push(...batchResults);
            onStep("完成一批30个产品更新请求");
          } catch (error) {
            onStep("更新产品批次请求失败");
            throw error;
          }
          updateDishReqs.length = 0;
        }
      } else {
        onStep(`${dish.nameZH} 系统已存在，无需更新`);
      }
    } else {
      onStep(`正在新建产品: ${dish.nameZH}`);
      const newDish = {
        code: dish.code,
        color: "#ffffff",
        price: dish.price,
        image: "",
        langs: [
          {desc: dish.descDE ?? "", lang: "DE", name: dish.nameDE},
          {desc: dish.descZH ?? "", lang: "ZH", name: dish.nameZH},
          {desc: dish.descEN ?? "", lang: "EN", name: dish.nameEN},
        ],
        isActive: dish.isActive ? dish.isActive : "1",
        keyInstruction: dish.keyInstruction ? dish.keyInstruction : "",
        printGroupId: dish.printCatId,
        categoryId:
            categoryDict.find(
                (it) =>
                    it.langs.find((x) => x.lang === "ZH").name.toLowerCase() ===
                    dish.catNameZH.toLowerCase()
            )?.id ?? "",
      };
      addDishReqs.push(addDish(url, newDish));

      if (addDishReqs.length === 30) {
        onStep("执行一批30个产品新增请求");
        try {
          const batchResults = await Promise.all(addDishReqs);
          allAddResults.push(...batchResults);
          onStep("完成一批30个产品新增请求");
        } catch (error) {
          onStep("新增产品批次请求失败");
          throw error;
        }
        addDishReqs.length = 0;
      }
    }
  }

  // 处理剩余请求
  try {
    if (updateDishReqs.length > 0) {
      onStep("处理剩余的产品更新请求...");
      const remainingResults = await batchRequests(updateDishReqs, 5);
      allUpdateResults.push(...remainingResults);
      onStep("剩余产品更新请求处理完成");
    }
    if (addDishReqs.length > 0) {
      onStep("处理剩余的产品新增请求...");
      const remainingResults = await batchRequests(addDishReqs, 5);
      allAddResults.push(...remainingResults);
      onStep("剩余产品新增请求处理完成");
    }
  } catch (e) {
    console.log(e, "dish相关");
  }
}

async function batchRequests(requests, batchSize = 5) {
  const results = [];
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    console.log(`开始第 ${Math.floor(i / batchSize) + 1} 批请求，数量: ${batch.length}`);
    try {
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      console.log(`第 ${Math.floor(i / batchSize) + 1} 批请求完成`);
    } catch (error) {
      console.error(`第 ${Math.floor(i / batchSize) + 1} 批请求失败:`, error);
      throw error;
    }
  }
  return results;
}

function clearData() {
  file.value = null;
  fileData.value = [];
  deviceIds.value = [];
  currentUrl.value = "";
  log.value = [];
  step.value = "";
  currentStep.value = 0;
  uploadStatus.value = "process";
  stepLog.value = [];
}
</script>

<template>
  <div class="main-container pa-4">
    <n-card title="库迪数据上传">
      <div class="upload-section">
        <n-space vertical>
          <DeviceIdSelector
            v-model:value="deviceIds"
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
        v-if="deviceIds.length > 0"
        id="stepLog"
        class="mt-4"
      >
        <n-card title="上传进度">
          <n-tabs
            type="card"
            animated
          >
            <template
              v-for="item in deviceIds"
              :key="item"
            >
              <n-tab-pane
                :name="item"
                :tab="item"
              >
                <div
                  class="step-content"
                  v-html="
                    stepLogDisplay(stepLog.find((s) => s.deviceId === item)?.step) ||
                      '等待开始...'
                  "
                />
              </n-tab-pane>
            </template>
          </n-tabs>
        </n-card>
      </div>

      <div
        v-if="!loading && fileData.length > 0"
        class="no-data mt-4"
      >
        <div>共 {{ fileData.length }} 条数据</div>
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

.log-content,
.step-content {
  white-space: pre-wrap;
  font-family: monospace;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.6;
}
</style>
