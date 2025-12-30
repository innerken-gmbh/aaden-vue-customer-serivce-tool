<script setup lang="ts">
import { onMounted, ref, h, computed } from "vue";
import { NDataTable, NButton, NSpace, NPopconfirm, useMessage, NSelect, NInput, NPagination, NModal, NForm, NFormItem } from 'naive-ui';
import { getTaxInjectedList,updateInjectedList,deleteInjectedList } from "@/store/aaden/tools/tax-injected";
import dayjs from "dayjs";

const message = useMessage();
const tableList = ref([]);
const loading = ref(false);
const selectedStatus = ref(null);
const selectedDeviceId = ref(null);
const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0
});

// Comment dialog state
const showCommentDialog = ref(false);
const currentComment = ref('');
const currentRow = ref(null);

// Compute unique status values from tableList for the dropdown
const statusOptions = ref([{label: '全部', value: 'All'},{label: '未操作', value: 'None'},{label: '已注入', value: 'Injected'},{label: '已完成', value: 'Done'},{label: '已忽略', value: 'Admin'}])

// Filter tableList based on selected status and deviceId
const filteredList = computed(() => {
  let filtered = tableList.value;

  // Apply status filter
  if (selectedStatus.value && selectedStatus.value !== 'All') {
    filtered = filtered.filter(item => item.status === selectedStatus.value);
  }

  // Apply deviceId filter
  if (selectedDeviceId.value) {
    filtered = filtered.filter(item => item.deviceId.includes(selectedDeviceId.value));
  }

  // Update pagination item count
  pagination.value.itemCount = filtered.length;
  pagination.value.page = 1

  return filtered;
});

// Paginated list for display
const paginatedList = computed(() => {
  const { page, pageSize } = pagination.value;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return filteredList.value.slice(startIndex, endIndex);
});

// Handle page change
const handlePageChange = (currentPage) => {
  pagination.value.page = currentPage;
};

// Handle page size change
const handlePageSizeChange = (pageSize) => {
  pagination.value.pageSize = pageSize;
  // Reset to first page when changing page size
  pagination.value.page = 1;
};

onMounted(async () => {
  await reload();
});

async function reload () {
  loading.value = true;
  try {
    tableList.value = (await getTaxInjectedList()).map(it => {
      if (it.status === 'None') {
        it.statusDisplay = '未操作'
      } else if (it.status === 'Injected') {
        it.statusDisplay = '已注入'
      } else if (it.status === 'Done') {
        it.statusDisplay = '已完成'
      } else if (it.status === 'Admin') {
        it.statusDisplay = '已忽略'
      }
      return it
    });
    console.log(tableList.value, 'tableList.value');
  } catch (error) {
    console.error('Failed to load data:', error);
    message.error('Failed to load data');
  } finally {
    loading.value = false;
  }
}

const handleDelete = async (row) => {
  await deleteInjectedList(row.id)
  message.success(`${row.id}删除成功！`);
  // Implement actual delete functionality here
};

const handleUpdate = async (row) => {
  console.log(row, 'row')
  const updateInfo = {
    deviceId: row.deviceId,
    status: 'Admin',
    date: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
    note: ''
  }
  await updateInjectedList(updateInfo)

  message.success(`${row.deviceId}  忽略成功！`);
  await reload();
  // Implement actual update functionality here
};

// Handle opening the comment dialog
const handleOpenComment = (row) => {
  currentRow.value = row;
  currentComment.value = row.note || '';
  showCommentDialog.value = true;
};

// Handle saving the comment
const handleSaveComment = async () => {
  if (!currentRow.value) return;

  const updateInfo = {
    deviceId: currentRow.value.deviceId,
    status: currentRow.value.status,
    date: dayjs().format('YYYY-MM-DDTHH:mm:ss'),
    note: currentComment.value
  };

  try {
    await updateInjectedList(updateInfo);
    message.success('备注保存成功！');
    showCommentDialog.value = false;
    await reload();
  } catch (error) {
    console.error('Failed to save comment:', error);
    message.error('备注保存失败');
  }
};

const columns = computed(() => [
  {
    title: 'Device ID',
    key: 'deviceId',
  },
  {
    title: 'Date',
    key: 'date',
  },
  {
    title: 'Status',
    key: 'status',
  },
  {
    title: 'Status Display',
    key: 'statusDisplay',
  },
  {
    title: '备注',
    key: 'note',
    render(row) {
      return row.note || '—';
    }
  },
  {
    title: 'Operation',
    key: 'actions',
    render(row) {
      return h(NSpace, { size: 8 }, {
        default: () => [
          h(NButton, {
            size: 'small',
            onClick: () => handleOpenComment(row)
          }, { default: () => '备注' }),
          h(NButton, {
            size: 'small',
            onClick: () => handleUpdate(row)
          }, { default: () => '忽略' }),
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
  <div class="p-4">
    <h1 class="text-xl font-semibold mb-4">
      Device Records
    </h1>

    <div class="mb-4">
      <n-space
        align="center"
        size="large"
      >
        <n-space align="center">
          <span>Status:</span>
          <n-select
            v-model:value="selectedStatus"
            :options="statusOptions"
            placeholder="Filter by status"
            style="width: 200px"
          />
        </n-space>

        <n-space align="center">
          <span>Device ID:</span>
          <n-input
            v-model:value="selectedDeviceId"
            placeholder="Filter by device ID"
            style="width: 200px"
          />
        </n-space>
      </n-space>
    </div>

    <n-data-table
      :columns="columns"
      :data="paginatedList"
      :loading="loading"
      :bordered="false"
      :row-key="row => row.deviceId"
      :pagination="false"
    />

    <div class="flex justify-center mt-4">
      <n-pagination
        v-model:page="pagination.page"
        :page-size="pagination.pageSize"
        :item-count="pagination.itemCount"
        show-size-picker
        :page-sizes="[10, 20, 30, 50]"
        show-quick-jumper
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      >
        <template #prefix="{ itemCount }">
          共 {{ itemCount }} 项
        </template>
      </n-pagination>
    </div>
  </div>

  <!-- Comment Dialog -->
  <n-modal
    v-model:show="showCommentDialog"
    preset="card"
    title="备注"
    style="max-width: 600px"
  >
    <n-form>
      <n-form-item>
        <n-input
          v-model:value="currentComment"
          type="textarea"
          placeholder="请输入备注内容"
          :autosize="{ minRows: 3, maxRows: 10 }"
        />
      </n-form-item>
      <div class="flex justify-end gap-2 mt-4">
        <n-button @click="showCommentDialog = false">
          取消
        </n-button>
        <n-button
          type="primary"
          @click="handleSaveComment"
        >
          保存
        </n-button>
      </div>
    </n-form>
  </n-modal>
</template>

<style scoped lang="scss">
.n-data-table {
  margin-top: 16px;
}
</style>
