<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue';
import { FormInst, useMessage, useDialog, NButton, NSpace, NDataTable, NCard, NModal, NForm, NGrid, NFormItemGi, NInput, NDatePicker } from 'naive-ui';
import { getSystemSoftwares, addSystemSoftware, updateSystemSoftware, deleteSystemSoftware } from '../../store/aaden/france/systemSoftware'

const message = useMessage();
const dialog = useDialog();
const formRef = ref<FormInst | null>(null);
const showModal = ref(false);

interface SoftwareModel {
  id?: number | string;
  name: string;
  version: string;
}

const initialModel: SoftwareModel = {
  name: '',
  version: ''
};

const model = reactive<SoftwareModel>({ ...initialModel });

const dataList = ref<SoftwareModel[]>([]);

const rules = {
  name: { required: true, message: '请输入名称', trigger: ['blur', 'input'] },
  version: { required: true, message: '请输入版本号', trigger: ['blur', 'input'] }
};

const columns = [
  { title: '名称', key: 'name' },
  { title: '版本号', key: 'version' },
  {
    title: '操作',
    key: 'actions',
    render(row: SoftwareModel) {
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                onClick: () => handleEdit(row)
              },
              { default: () => '编辑' }
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                onClick: () => handleDelete(row)
              },
              { default: () => '删除' }
            )
          ]
        }
      );
    }
  }
];

const handleAdd = () => {
  Object.assign(model, initialModel);
  delete model.id;
  showModal.value = true;
};

const handleEdit = (row: SoftwareModel) => {
  Object.assign(model, row);
  showModal.value = true;
};

const handleDelete = (row: SoftwareModel) => {
  if (!row.id) {
    message.error('无法删除：缺少ID');
    return;
  }
  dialog.warning({
    title: '确认删除',
    content: '确定要删除该软件信息吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteSystemSoftware(row.id as number | string);
        message.success('删除成功');
        fetchData();
      } catch (error) {
        message.error('删除失败');
      }
    }
  });
};

const handleSave = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        if (model.id) {
          await updateSystemSoftware(model.id, { ...model });
          message.success('修改成功');
        } else {
          await addSystemSoftware({ ...model });
          message.success('保存成功');
        }
        showModal.value = false;
        fetchData();
      } catch (error) {
        message.error('操作失败');
      }
    } else {
      message.error('请检查输入项');
    }
  });
};

const fetchData = async () => {
  try {
    const res = await getSystemSoftwares()
    dataList.value = res || []
  } catch (error) {
    message.error('获取数据失败')
  }
}

onMounted(() => {
  fetchData()
})

const handleClear = () => {
  Object.assign(model, initialModel);
  delete model.id;
  message.info('表单已清空');
};
</script>

<template>
  <div class="main-container pa-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold m-0">
        系统软件信息
      </h2>
      <n-button
        type="primary"
        @click="handleAdd"
      >
        新增软件
      </n-button>
    </div>

    <n-card :segmented="true">
      <n-data-table
        :columns="columns"
        :data="dataList"
        :bordered="false"
        :pagination="{ pageSize: 10 }"
      />
    </n-card>

    <n-modal
      v-model:show="showModal"
      preset="card"
      title="软件信息维护"
      style="width: 800px"
    >
      <n-form
        ref="formRef"
        :model="model"
        :rules="rules"
        label-placement="left"
        label-width="120"
        require-mark-placement="right-hanging"
        size="medium"
      >
        <n-grid
          :cols="24"
          :x-gap="24"
        >
          <n-form-item-gi
            :span="12"
            label="名称"
            path="name"
          >
            <n-input
              v-model:value="model.name"
              placeholder="请输入名称"
            />
          </n-form-item-gi>
          <n-form-item-gi
            :span="12"
            label="版本号"
            path="version"
          >
            <n-input
              v-model:value="model.version"
              placeholder="请输入版本号"
            />
          </n-form-item-gi>
        </n-grid>

        <div class="flex justify-end mt-4 gap-4">
          <n-button @click="handleClear">
            清空
          </n-button>
          <n-button
            type="primary"
            @click="handleSave"
          >
            保存
          </n-button>
        </div>
      </n-form>
    </n-modal>
  </div>
</template>

<style scoped lang="scss">
.main-container {
  padding: 20px;
}
</style>
