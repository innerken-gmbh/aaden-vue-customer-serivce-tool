<script setup lang="ts">
import { onMounted, ref, h, computed } from "vue";
import { NDataTable, NButton, NSpace, NPopconfirm, useMessage, NSelect } from 'naive-ui';
import { getTaxInjectedList,updateInjectedList,deleteInjectedList } from "@/store/aaden/tools/tax-injected";
import dayjs from "dayjs";

const message = useMessage();
const tableList = ref([]);
const loading = ref(false);
const selectedStatus = ref(null);
const selectedDeviceId = ref(null);

// Compute unique status values from tableList for the dropdown
const statusOptions = ref(['All','None','Injected','Done','Admin'].map(it => {
  return { label: it, value: it }
}))

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

  return filtered;
});

onMounted(async () => {
  await reload();
});

async function reload () {
  loading.value = true;
  try {
    tableList.value = await getTaxInjectedList();
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
    date: dayjs().format('YYYY-MM-DDTHH:mm:ss')
  }
  await updateInjectedList(updateInfo)

  message.success(`${row.deviceId}  忽略成功！`);
  await reload();
  // Implement actual update functionality here
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
    title: 'Operation',
    key: 'actions',
    render(row) {
      return h(NSpace, { size: 8 }, {
        default: () => [
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
      :data="filteredList"
      :loading="loading"
      :bordered="false"
      :row-key="row => row.deviceId"
    />
  </div>
</template>

<style scoped lang="scss">
.n-data-table {
  margin-top: 16px;
}
</style>
