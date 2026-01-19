<script setup lang="ts">

import {NButton, NDataTable, NPopconfirm, NSpace, NModal, NForm, NFormItem, NInput, useMessage} from "naive-ui";
import {computed, h, ref, onMounted} from "vue";
import {getCottiApiKeyList, addCottiApiKey, updateCottiApiKey, deleteCottiApiKey} from "@/store/aaden/tools/cotti";

const message = useMessage();
const loading = ref(false);
const dataList = ref([]);
const showModal = ref(false);
const modalType = ref('add'); // 'add' or 'edit'
const formData = ref({
  deviceId: '',
  remark: ''
});
const currentRow = ref(null);

// Fetch data on component mount
onMounted(async () => {
  await fetchData();
});

// Fetch data from API
async function fetchData() {
  loading.value = true;
  try {
    dataList.value = await getCottiApiKeyList();
  } catch (error) {
    console.error('Error fetching data:', error);
    message.error('Failed to fetch data');
  } finally {
    loading.value = false;
  }
}

// Open dialog for adding new entry
function handleAdd() {
  modalType.value = 'add';
  formData.value = {
    deviceId: '',
    remark: ''
  };
  showModal.value = true;
}

// Open dialog for editing entry
function handleUpdate(row) {
  modalType.value = 'edit';
  currentRow.value = row;
  formData.value = {
    deviceId: row.deviceId,
    remark: row.remarks || ''
  };
  showModal.value = true;
}


// Delete entry
async function handleDelete(row) {
  loading.value = true;
  try {
    await deleteCottiApiKey(row.id);
    message.success('Deleted successfully');
    await fetchData();
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
      await addCottiApiKey(formData.value.deviceId, formData.value.remark);
      message.success('Added successfully');
    } else if (modalType.value === 'edit' || modalType.value === 'remark') {
      await updateCottiApiKey(currentRow.value.id, formData.value.deviceId, formData.value.remark);
      message.success(modalType.value === 'edit' ? 'Updated successfully' : 'Remark updated successfully');
    }
    showModal.value = false;
    await fetchData();
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
  {
    title: 'Manager',
    key: 'managerId',
  },
  {
    title: 'Remarks',
    key: 'remarks',
  },
  {
    title: 'Operation',
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
      <n-button
        type="primary"
        @click="handleAdd"
      >
        Add New
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
          <n-form-item
            label="Device ID"
            :required="modalType === 'add'"
          >
            <n-input
              v-model:value="formData.deviceId"
              placeholder="Enter device ID"
              :disabled="modalType !== 'add'"
            />
          </n-form-item>
          <n-form-item label="Remark">
            <n-input
              v-model:value="formData.remark"
              placeholder="Enter remark"
              type="textarea"
              :rows="3"
            />
          </n-form-item>
        </n-form>

        <template #footer>
          <div class="flex justify-end gap-2">
            <n-button @click="showModal = false">
              Cancel
            </n-button>
            <n-button
              type="primary"
              :loading="loading"
              @click="handleSubmit"
            >
              Submit
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
