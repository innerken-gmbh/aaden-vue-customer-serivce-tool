<script setup lang="ts">
import {ref, reactive, h, onMounted} from 'vue';
import { FormInst, useMessage, useDialog, NButton, NSpace, NDataTable, NCard, NModal, NForm, NGrid, NFormItemGi, NInput, NDatePicker } from 'naive-ui';
import { getSystemProducers, addSystemProducer, updateSystemProducer, deleteSystemProducer } from '../../store/aaden/france/systemProducer'
const message = useMessage();
const dialog = useDialog();
const formRef = ref<FormInst | null>(null);
const showModal = ref(false);

interface ProducerModel {
  id?: number | string;
  number: string;
  name: string;
  brand: string;
  model: string;
  serial: string;
  label: string;
  dateOfProduction: string | null;
  dateOfEntry: string | null;
}

const initialModel: ProducerModel = {
  number: '',
  name: '',
  brand: '',
  model: '',
  serial: '',
  label: '',
  dateOfProduction: null,
  dateOfEntry: null
};

const model = reactive<ProducerModel>({ ...initialModel });

const dataList = ref<ProducerModel[]>([]);

const rules = {
  number: { required: true, message: '请输入编号', trigger: ['blur', 'input'] },
  name: { required: true, message: '请输入名称', trigger: ['blur', 'input'] },
  brand: { required: true, message: '请输入品牌', trigger: ['blur', 'input'] },
  model: { required: true, message: '请输入型号', trigger: ['blur', 'input'] },
  serial: { required: true, message: '请输入序列号', trigger: ['blur', 'input'] },
  label: { required: true, message: '请输入标签', trigger: ['blur', 'input'] },
  dateOfProduction: { required: true, message: '请选择生产日期', trigger: ['blur', 'change'] },
  dateOfEntry: { required: true, message: '请选择入库日期', trigger: ['blur', 'change'] }
};

const columns = [
  { title: '编号', key: 'number' },
  { title: '名称', key: 'name' },
  { title: '品牌', key: 'brand' },
  { title: '型号', key: 'model' },
  { title: '序列号', key: 'serial' },
  { title: '标签', key: 'label' },
  { title: '生产日期', key: 'dateOfProduction' },
  { title: '启用日期', key: 'dateOfEntry' },
  {
    title: '操作',
    key: 'actions',
    render(row: ProducerModel) {
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

const handleEdit = (row: ProducerModel) => {
  Object.assign(model, row);
  showModal.value = true;
};

const handleDelete = (row: ProducerModel) => {
  if (!row.id) {
    message.error('无法删除：缺少ID');
    return;
  }
  dialog.warning({
    title: '确认删除',
    content: '确定要删除该终端信息吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteSystemProducer(row.id!);
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
          await updateSystemProducer(model.id, { ...model });
          message.success('修改成功');
        } else {
          await addSystemProducer({ ...model });
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
    const res = await getSystemProducers()
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
        系统厂商终端信息
      </h2>
      <n-button
        type="primary"
        @click="handleAdd"
      >
        新增终端
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
      title="终端信息维护"
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
            label="编号"
            path="number"
          >
            <n-input
              v-model:value="model.number"
              placeholder="请输入编号"
            />
          </n-form-item-gi>
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
            label="品牌"
            path="brand"
          >
            <n-input
              v-model:value="model.brand"
              placeholder="请输入品牌"
            />
          </n-form-item-gi>
          <n-form-item-gi
            :span="12"
            label="型号"
            path="model"
          >
            <n-input
              v-model:value="model.model"
              placeholder="请输入型号"
            />
          </n-form-item-gi>
          <n-form-item-gi
            :span="12"
            label="序列号"
            path="serial"
          >
            <n-input
              v-model:value="model.serial"
              placeholder="请输入序列号"
            />
          </n-form-item-gi>
          <n-form-item-gi
            :span="12"
            label="标签"
            path="label"
          >
            <n-input
              v-model:value="model.label"
              placeholder="请输入标签"
            />
          </n-form-item-gi>
          <n-form-item-gi
            :span="12"
            label="生产日期"
            path="dateOfProduction"
          >
            <n-date-picker
              v-model:formatted-value="model.dateOfProduction"
              value-format="yyyy-MM-dd"
              type="date"
              clearable
              style="width: 100%"
            />
          </n-form-item-gi>
          <n-form-item-gi
            :span="12"
            label="启用日期"
            path="dateOfEntry"
          >
            <n-date-picker
              v-model:formatted-value="model.dateOfEntry"
              value-format="yyyy-MM-dd"
              type="date"
              clearable
              style="width: 100%"
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
