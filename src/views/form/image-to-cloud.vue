<template>
  <div class="main-container">
    <base-container>
      <j-space>
        <v-text-field
          v-model="startId"
          label="开始设备ID"
          hide-details
        />

        <v-text-field
          v-model="endId"
          label="结束设备ID"
          hide-details
        />
        <div>
          共{{ targetDeviceIds.length }}个目标
        </div>
      </j-space>

      <v-spacer />
      <primary-button
        text="开始"
        @click="start"
      />
    </base-container>
    <base-container class="mt-4">
      {{ progressDisplay }}
    </base-container>
    <div>
      <div
        v-for="log in logs"
        :key="log.id"
        class="log-item text-body-2"
      >
        <span class="dish-name">{{ log.dishName }}</span>
        <span class="progress">{{ log.progress }}</span>

        <span class="message">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref, watch} from "vue";
import {getEndPointUrl} from "@/old/utils/firebase";
import hillo from "hillo";
import {getImageFile, getNgrokResourceUrl, uploadFile} from "@/store/aaden/utils";
import {saveImageInfo} from "@/store/aaden/cloud-v2-api";
import PrimaryButton from "@/views/BaseWidget/basic/button/PrimaryButton.vue";
import BaseContainer from "@/views/BaseWidget/basic/BaseContainer.vue";
import JSpace from "@/views/BaseWidget/basic/JSpace.vue";
import dayjs from "dayjs";

const startId = ref(1)
const endId = ref(1)

async function start() {
  errors = []
  logs.value = []
  for (const deviceId of targetDeviceIds.value) {
    try {
      await toCloudOne(deviceId)
    } catch (e) {
      doLog("error on " + deviceId)
      doLog(e.message)
      console.error(e)
    }
  }
}

const targetDeviceIds = computed(() => {
  return Array.from({length: parseInt(endId.value) - parseInt(startId.value) + 1}, (v, i) => i + parseInt(startId.value));
})


const progressDisplay = ref("尚未开始");
const logs = ref([]);
let id = 0;
let errors = [];

watch(startId, () => {
  endId.value = startId.value
})

function updateLog(dishName, progress, message, isError = false) {
  const existingLog = logs.value.find(log => log.dishName === dishName);

  if (existingLog) {
    existingLog.progress = progress;
    existingLog.message = message;
  } else {
    logs.value.push({
      id: id++,
      dishName,
      progress,
      message,
      isError
    });
  }

  if (isError) {
    errors.push(`${dishName}: ${message}`);
  }
}

async function displayProgress(current, total, startTime) {
  const elapsedTime = dayjs().diff(startTime, 'second');
  const averageTimePerItem = elapsedTime / current;
  const remainingItemCount = total - current;
  const estimatedRemainingTime = averageTimePerItem * remainingItemCount;

  progressDisplay.value = `进度: ${current}/${total}, 预计剩余时间: ${estimatedRemainingTime.toFixed(2)} s`;
}

async function processDish(id, dish, progressCallback, startTime) {
  const dishName = dish.dishName;
  try {
    updateLog(dishName, "██▒▒▒▒▒▒▒▒▒▒", "0% - 正在开始处理...");
    if (dish.image && !dish.image.endsWith('.')) {
      updateLog(dishName, "███▒▒▒▒▒▒▒▒▒", "20% - 正在下载图片...");
      const file = await getImageFile(getNgrokResourceUrl(id) + 'dishImg/' + dish.image);
      updateLog(dishName, "█████▒▒▒▒▒▒▒", "40% - 正在上传图片...");
      const fileUrl = await uploadFile(file);
      updateLog(dishName, "███████▒▒▒▒▒", "60% - 正在保存信息...");
      await saveImageInfo(id, fileUrl, dish.dishId);
      updateLog(dishName, "█████████▒▒▒", "80% - 快完成了...");
      updateLog(dishName, "████████████", "100% - 完成处理.");
    } else {
      updateLog(dishName, "████████████", "100% - 没有找到有效的图片");
    }
  } catch (error) {
    updateLog(dishName, "████████████", `100% - 错误: ${error.message}`, true);
  } finally {
    progressCallback();
  }
}


async function toCloudOne(id) {
  updateLog("general", "", "开始处理id: " + id);
  const endPoint = getEndPointUrl(id);
  const ngrokOpenUrl = endPoint + 'AccessLog.php?op=deviceId';
  let open = false;

  try {
    open = !!await hillo.get(ngrokOpenUrl);
    updateLog("general", "", "Ngrok连接已建立.");
  } catch (e) {
    updateLog("general", "", "Ngrok连接失败, 跳过.");
  }

  if (open) {
    const dishes = (await hillo.get(endPoint + "Dishes.php")).content;
    const totalDishes = dishes.length;
    let completedDishes = 0;
    const startTime = dayjs();

    // 初始化每个菜品的日志条目
    dishes.forEach(dish => {
      updateLog(dish.dishName, "", `初始化 ${dish.dishName}...`);
    });

    const progressCallback = () => {
      completedDishes++;
      displayProgress(completedDishes, totalDishes, startTime);
    };

    if (totalDishes > 0) {
      const tasks = dishes.map(dish => processDish(id, dish, progressCallback, startTime));

      await Promise.allSettled(tasks);

      const errorCount = errors.length;

      if (errorCount > 0) {
        updateLog("general", "", `处理完成，共 ${errorCount} 个错误.`);
      } else {
        updateLog("general", "", "所有菜品处理成功！");
      }
    }
  }
}

</script>

<style lang="scss" scoped>
.log-item {
  display: flex;
  padding: 8px;
  margin-bottom: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
  color: #333;
  white-space: pre-wrap; /* 保持换行符 */
  font-family: monospace; /* 使用等宽字体保证排列整齐 */
}

.progress {
  width: 15%; /* 设置进度条所占宽度 */
}

.dish-name {
  width: 25%; /* 设置菜品名称所占宽度 */
}

.message {
  width: 60%; /* 设置消息所占宽度 */
}
</style>
