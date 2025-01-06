<template>
  <div class="main-container pa-4">
    <v-row>
      <v-col cols="8">
        <div class="text-body-1">
          请上传你的Excel
        </div>
        <div>
          <v-file-input
            v-model="file"
            label="选择 Excel 文件"
            accept=".xlsx,.xls"
            @change="handleFileUpload"
          />
        </div>
        <div class="d-flex">
          <v-spacer />
          <v-btn
            variant="outlined"
            elevation="0"
            @click="simplifyExcel"
          >
            优化
          </v-btn>
        </div>
      </v-col>
      <v-col cols="4">
        <div class="d-flex flex-column">
          <div class="d-flex align-center justify-center">
            <div class="text-h5">
              简化规则
            </div>
            <v-spacer />
            <v-btn
              variant="outlined"
              elevation="0"
              @click="saveRules"
            >
              保存
            </v-btn>
          </div>

          <div class="mt-2">
            <v-textarea
              v-model="simplifyRules"
              auto-grow
              variant="outlined"
            />
          </div>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>

import {onMounted, ref} from "vue";
import {getRules, setRules} from "@/old/utils/firebase";
import * as XLSX from "xlsx";
import { OpenAI } from 'openai';

const simplifyRules = ref('')

onMounted(async () => {
  simplifyRules.value = await getRules()
})
async function saveRules () {
  await setRules(simplifyRules.value)
}
const file = ref(null)
const excelData = ref(null)
const needSimplifyList = ref('')

async function simplifyExcel () {
  console.log(process.env.OPENAI_API_KEY,'key')
  if (needSimplifyList.value) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    })
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',  // 或者使用其他模型，比如 "gpt-3.5-turbo"
        messages: [
              {role: 'system',content: simplifyRules.value},
              {role: 'user',content: '将:后面的字符串通过|分割然后优化每一个:' + needSimplifyList.value}
        ],
      });
      console.log(response.choices[0].message.content);
      console.log(response, 'resopnse')
    } catch (error) {
      console.error('Error:', error);
    }
  }
}
async function handleFileUpload () {
  if (file.value) {
    const reader = new FileReader()
    reader.onloadend = (e) => {
      console.log(e,'e')
      // 读取文件内容
      const data = e.target.result;
      // 使用 xlsx 解析 Excel 文件
      const workbook = XLSX.read(data, { type: "binary" });
      console.log(workbook,'book')

      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // 将工作表转换为 JSON 格式
      excelData.value = XLSX.utils.sheet_to_json(sheet);
      needSimplifyList.value = excelData.value.map(it => it.nameDE).join('|');

      console.log(excelData.value,'data')
    }
    reader.readAsBinaryString(file.value);
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
