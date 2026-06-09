<script setup lang="ts">

import {NButton, NDataTable, NPopconfirm, NSpace, NModal, NForm, NFormItem, NInput, useMessage} from "naive-ui";
import {computed, h, ref, onMounted, watch} from "vue";
import {getApiKeyList, addApiKey, updateApiKey, deleteApiKey, getAllManagerKey} from "@/store/aaden/tools/other-key";

const message = useMessage();
const loading = ref(false);
const dataList = ref([]);
const showModal = ref(false);
const modalType = ref('add'); // 'add' or 'edit'
const formData = ref({
  deviceId: '',
  remark: '',
  externalKey: ''
});
const currentRow = ref(null);
const allManagerList = ref([])
const managerValue = ref(null)

// Fetch data on component mount
onMounted(async () => {
  await fetchData();
});

// Fetch data from API
async function fetchData() {
  loading.value = true;
  try {
    allManagerList.value = await getAllManagerKey()
    console.log(allManagerList.value, 'allManagerList.value')
  } catch (error) {
    console.error('Error fetching data:', error);
    message.error('Failed to fetch data');
  } finally {
    loading.value = false;
  }
}

async function reloadData () {
  loading.value = true;
  try {
    dataList.value = await getApiKeyList(managerValue.value);
  } catch (error) {
    console.error('Error fetching data:', error);
    message.error('Failed to fetch data');
  } finally {
    loading.value = false;
  }
}

const currentDisplay = computed(() => {
  return allManagerList.value.find(it => it.uuid === managerValue.value)?.managerName ?? '';
})

function onManagerChange (val) {
  console.log(val, 'val');
  managerValue.value = val
  reloadData()
}

// Open dialog for adding new entry
function handleAdd() {
  modalType.value = 'add';
  formData.value = {
    deviceId: '',
    remark: '',
    externalKey: ''
  };
  showModal.value = true;
}

// Open dialog for editing entry
function handleUpdate(row) {
  modalType.value = 'edit';
  currentRow.value = row;
  formData.value = {
    deviceId: row.deviceId,
    remark: row.remarks || '',
    externalKey: row.externalKey || ''
  };
  showModal.value = true;
}


// Delete entry
async function handleDelete(row) {
  loading.value = true;
  try {
    await deleteApiKey(row.id, managerValue.value);
    message.success('Deleted successfully');
    await reloadData();
  } catch (error) {
    console.error('Error deleting:', error);
    message.error('Failed to delete');
  } finally {
    loading.value = false;
  }
}

// Submit form
async function handleSubmit() {
  loading.value = true;
  try {
    console.log(formData.value);
    if (modalType.value === 'add') {
      await addApiKey(formData.value.deviceId, formData.value.remark, managerValue.value, formData.value.externalKey);
      message.success('Added successfully');
    } else if (modalType.value === 'edit' || modalType.value === 'remark') {
      await updateApiKey(currentRow.value.id, formData.value.deviceId, formData.value.remark, formData.value.externalKey, managerValue.value);
      message.success(modalType.value === 'edit' ? 'Updated successfully' : 'Remark updated successfully');
    }
    showModal.value = false;
    await reloadData();
  } catch (error) {
    console.error('Error submitting:', error);
    message.error('Failed to submit');
  } finally {
    loading.value = false;
  }
}

const columns = computed(() => [
  {
    title: 'Device ID',
    key: 'deviceId',
  },
  {
    title: 'ApiKey',
    key: 'apiKey',
  },
  // {
  //   title: 'Manager',
  //   key: 'managerId',
  // },
  {
    title: '备注',
    key: 'remarks',
  },
  {
    title: '自定义Id',
    key: 'externalKey',
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(NSpace, { size: 8 }, {
        default: () => [
          h(NButton, {
            size: 'small',
            onClick: () => handleUpdate(row)
          }, { default: () => '修改' }),
          h(NPopconfirm, { onPositiveClick: () => handleDelete(row) }, {
            default: () => '你真的想删除这一条数据吗？',
            trigger: () => h(NButton, {
              size: 'small',
              type: 'error'
            }, { default: () => '删除' }),
          }),
        ],
      });
    },
  },
]);
</script>

<template>
  <div>
    <div class="mb-4 flex justify-end">
      <n-radio-group
        @update:value="onManagerChange"
      >
        <n-radio-button
          v-for="(item,index) in allManagerList"
          :key="index"
          class="mr-4"
          :value="item.uuid"
          :label="item.managerName"
        />
      </n-radio-group>
      <!--      <n-select-->
      <!--        v-model:value="managerValue"-->
      <!--        style="width: 300px"-->
      <!--        label-field="managerName"-->
      <!--        value-field="uuid"-->
      <!--        :options="allManagerList"-->
      <!--      />-->
      <n-button
        v-if="managerValue"
        type="primary"
        @click="handleAdd"
      >
        新建ApiKey
      </n-button>
    </div>

    <n-data-table
      :columns="columns"
      :data="dataList"
      :loading="loading"
      :bordered="false"
      :row-key="row => row.deviceId"
    />

    <!-- Add/Edit Dialog -->
    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
    >
      <n-card
        style="width: 500px"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <n-form>
          <div class="text-h5 mb-2">
            {{ currentDisplay }}
          </div>
          <n-form-item
            label="Device ID"
            :required="modalType === 'add'"
          >
            <n-input
              v-model:value="formData.deviceId"
              placeholder="请输入DeviceId"
              :disabled="modalType !== 'add'"
            />
          </n-form-item>
          <n-form-item label="备注">
            <n-input
              v-model:value="formData.remark"
              placeholder="请输入备注"
              type="textarea"
              :rows="3"
            />
          </n-form-item>
          <n-form-item label="自定义Id">
            <n-input
              v-model:value="formData.externalKey"
              placeholder="请输入自定义Id"
              type="textarea"
              :rows="3"
            />
          </n-form-item>
        </n-form>

        <template #footer>
          <div class="flex justify-end gap-2">
            <n-button @click="showModal = false">
              取消
            </n-button>
            <n-button
              type="primary"
              :loading="loading"
              @click="handleSubmit"
            >
              提交
            </n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<style scoped lang="scss">
.mb-4 {
  margin-bottom: 1rem;
}
.flex {
  display: flex;
}
.justify-end {
  justify-content: flex-end;
}
.gap-2 {
  gap: 0.5rem;
}
</style>
