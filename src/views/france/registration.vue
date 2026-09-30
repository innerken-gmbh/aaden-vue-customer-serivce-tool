<script setup lang="ts">
import { ref, reactive, h, onMounted, computed } from 'vue';
import { FormInst, useMessage, useDialog, NButton, NSpace, NDataTable, NCard, NModal, NForm, NGrid, NFormItemGi, NInput, NSelect, NInputNumber, NDivider, NDatePicker, NTabs, NTabPane, NDescriptions, NDescriptionsItem, NTag } from 'naive-ui';
import { getRegistrations, addRegistration,getRegistrationDetailById, getRegistrationById, deleteRegistration, resendRegistration } from '../../store/aaden/france/registration';
import { addSystemProducer,getSystemProducers } from '../../store/aaden/france/systemProducer';
import { addSystemSoftware,getSystemSoftwares } from '../../store/aaden/france/systemSoftware';
import dayjs from "dayjs";


const message = useMessage();
const dialog = useDialog();
const formRef = ref<FormInst | null>(null);
const showModal = ref(false);
const showDetailModal = ref(false);
const detailModel = ref<any>(null);

interface RegistrationModel {
  id?: string;
  env: string;
  deviceId: string;
  taxpayer: {
    taxpayerType: 'COMPANY' | 'INDIVIDUAL';
    siren: string;
    address: {
      street: string;
      number: string;
      postalCode: string;
      city: string;
      country: string;
    };
    legalForm: string;
    nafApeCode: string;
    fiscalYearDate: string;
    // COMPANY
    companyName?: string;
    tradeName?: string;
    // INDIVIDUAL
    personLegalName?: string;
    person?: {
      gender: 'MALE' | 'FEMALE' | 'DIVERSE';
      forename: string;
      surname: string;
      prefix: string | null;
      infix: string | null;
      suffix: string | null;
    };
  };
  locationSiret: string;
  locationStreet: string;
  locationNumber: string;
  locationPostalCode: string;
  locationCity: string;
  locationCountry: string;
  hardware: {
    number: string;
    name: string;
    brand: string;
    model: string;
    serial: string;
    label: string;
    dateOfProduction: string | null;
    dateOfEntry: string | null;
  };
  software: {
    name: string;
    version: string;
  };
}

const initialModel: RegistrationModel = {
  env: 'TEST',
  deviceId: '',
  taxpayer: {
    taxpayerType: 'COMPANY',
    siren: '',
    address: {
      street: '',
      number: '',
      postalCode: '',
      city: '',
      country: 'FR'
    },
    legalForm: '',
    nafApeCode: '',
    fiscalYearDate: '01-01',
    companyName: '',
    tradeName: '',
    personLegalName: '',
    person: {
      gender: 'MALE',
      forename: '',
      surname: '',
      prefix: null,
      infix: null,
      suffix: null
    }
  },
  locationSiret: '',
  locationStreet: '',
  locationNumber: '',
  locationPostalCode: '',
  locationCity: '',
  locationCountry: 'FR',
  hardware: {
    number: '',
    name: '',
    brand: '',
    model: '',
    serial: '',
    label: '',
    dateOfProduction: null,
    dateOfEntry: null
  },
  software: {
    name: '',
    version: ''
  }
};

const model = reactive<RegistrationModel>(JSON.parse(JSON.stringify(initialModel)));

const dataList = ref<RegistrationModel[]>([]);

const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getRegistrations();
    dataList.value = res || [];

    const producers = await getSystemProducers() || [];
    const uniqueProducers = [];
    const pSet = new Set();
    for (const item of producers) {
      const key = `${item.name}`;
      if (!pSet.has(key)) {
        pSet.add(key);
        uniqueProducers.push(item);
      }
    }
    producersList.value = uniqueProducers;

    const softwares = await getSystemSoftwares() || [];
    const uniqueSoftwares = [];
    const sSet = new Set();
    for (const item of softwares) {
      const key = `${item.name}-${item.version}`;
      if (!sSet.has(key)) {
        sSet.add(key);
        uniqueSoftwares.push(item);
      }
    }
    softwaresList.value = uniqueSoftwares;
  } catch (error) {
    message.error('获取列表失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const rules = {
  deviceId: {
    required: true,
    message: '请输入门店设备号',
    trigger: ['blur', 'input']
  },
  'taxpayer.siren': {
    required: true,
    validator(rule: any, value: string) {
      if (!value) {
        return new Error('请输入 9 位 SIREN');
      }
      if (!/^\d{9}$/.test(value)) {
        return new Error('SIREN 必须是 9 位数字');
      }
      return true;
    },
    trigger: ['blur', 'input']
  },
  'taxpayer.taxpayerType': {
    required: true,
    message: '请选择税务主体类型',
    trigger: ['blur', 'change']
  },
  'taxpayer.companyName': {
    required: true,
    message: '请输入法定名称',
    trigger: ['blur', 'input']
  },
  'taxpayer.personLegalName': {
    required: true,
    message: '请输入法定全名',
    trigger: ['blur', 'input']
  },
  'taxpayer.person.gender': {
    required: true,
    message: '请选择性别',
    trigger: ['blur', 'change']
  },
  'taxpayer.person.forename': {
    required: true,
    message: '请输入名',
    trigger: ['blur', 'input']
  },
  'taxpayer.person.surname': {
    required: true,
    message: '请输入姓',
    trigger: ['blur', 'input']
  },
  locationSiret: {
    required: true,
    validator(rule: any, value: string) {
      if (!value) {
        return new Error('请输入 14 位 SIRET');
      }
      if (!/^\d{14}$/.test(value)) {
        return new Error('SIRET 必须是 14 位数字');
      }
      return true;
    },
    trigger: ['blur', 'input']
  },
  'hardware.number': {
    required: true,
    message: '请输入硬件编号',
    trigger: ['blur', 'input']
  },
  'hardware.name': {
    required: true,
    message: '请输入硬件名称',
    trigger: ['blur', 'input']
  }
};

const envOptions = [
  { label: 'TEST', value: 'TEST' },
  { label: 'LIVE', value: 'LIVE' }
];

const taxpayerTypeOptions = [
  { label: '公司 (COMPANY)', value: 'COMPANY' },
  { label: '个人 (INDIVIDUAL)', value: 'INDIVIDUAL' }
];

const genderOptions = [
  { label: '男 (MALE)', value: 'MALE' },
  { label: '女 (FEMALE)', value: 'FEMALE' },
  { label: '其他 (DIVERSE)', value: 'DIVERSE' }
];

const columns = [
  { title: '环境', key: 'env' },
  { title: '设备号', key: 'deviceId' },
  { title: 'SIREN', key: 'taxpayer.siren' },
  {
    title: '法定名称',
    key: 'taxpayer.name',
    render(row: RegistrationModel) {
      return row.taxpayer.taxpayerType === 'COMPANY'
        ? row.taxpayer.companyName
        : row.taxpayer.personLegalName;
    }
  },
  { title: 'SIRET', key: 'locationSiret' },
  { title: '城市', key: 'locationCity' },
  {
    title: '操作',
    key: 'actions',
    render(row: RegistrationModel) {
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
                  onClick: () => handleDetail(row)
                },
                { default: () => '详情' }
            ),
            // h(
            //   NButton,
            //   {
            //     size: 'small',
            //     type: 'primary',
            //     onClick: () => handleEdit(row)
            //   },
            //   { default: () => '编辑' }
            // ),
            // h(
            //     NButton,
            //     {
            //       size: 'small',
            //       type: 'error',
            //       onClick: () => handleDelete(row)
            //     },
            //     { default: () => '删除' }
            // ),
            h(
                NButton,
                {
                  size: 'small',
                  type: 'warning',
                  onClick: () => handleResend(row)
                },
                { default: () => '重发' }
            ),
            // h(
            //     NButton,
            //     {
            //       size: 'small',
            //       type: 'info',
            //       onClick: () => handleRecheck(row)
            //     },
            //     { default: () => '轮询' }
            // )
          ]
        }
      );
    }
  }
];

const handleAdd = () => {
  Object.assign(model, JSON.parse(JSON.stringify(initialModel)));
  delete model.id;
  showModal.value = true;
};

const handleEdit = (row: RegistrationModel) => {
  Object.assign(model, JSON.parse(JSON.stringify(row)));
  showModal.value = true;
};

const handleDetail = async (row: RegistrationModel) => {
  detailModel.value = await getRegistrationDetailById(row.id);
  showDetailModal.value = true;
};

const locationDetail = computed(() => {
  return detailModel.value?.location;
})

const systemDetail = computed(() => {
  return detailModel.value?.system;
})

const taxpayerDetail = computed(() => {
  return detailModel.value?.taxpayer;
})

const handleDelete = (row: RegistrationModel) => {
  if (!row.id) {
    message.error('无法删除：缺少ID');
    return;
  }
  dialog.warning({
    title: '确认删除',
    content: '确定要删除该注册信息吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteRegistration(row.id!);
        message.success('删除成功');
        fetchData();
      } catch (error) {
        message.error('删除失败');
      }
    }
  });
};

const handleResend = async (row: RegistrationModel) => {
  if (!row.id) {
    message.error('无法重发：缺少ID');
    return;
  }
  try {
    await resendRegistration(row.id);
    message.success('重发成功');
  } catch (error) {
    message.error('重发失败');
  }
};

const handleRecheck = async (row: RegistrationModel) => {
  if (!row.id) {
    message.error('无法轮询：缺少ID');
    return;
  }
  try {
    await getRegistrationById(row.id);
    message.success('重发成功');
  } catch (error) {
    message.error('重发失败');
  }
};

const step = ref('')
const stepMap: Record<string, string> = {
  'GET_GROUP_TOKEN': '获取组织级 token（GROUP scope）',
  'CREATE_ORG': '创建 fiskaly Organization（门店组织）',
  'CREATE_SUBJECT': '创建 Subject（API 凭证主体）',
  'GET_UNIT_TOKEN': '获取 UNIT scope token（换取受管凭证）',
  'CREATE_TAXPAYER': '创建 Taxpayer（法国税务主体，含 SIREN/APE/地址）',
  'COMMISSION_TAXPAYER': '授信 Taxpayer',
  'CREATE_LOCATION': '创建 Location（场所）',
  'COMMISSION_LOCATION': '授信 Location',
  'CREATE_SYSTEM': '创建 System（收银设备，producer/software 引用）',
  'COMMISSION_SYSTEM': '授信 System',
  'COMPLETED': '完成'
};
const status = ref('')
const lastUpdateTimestamp = ref('')
const pollingShow = ref(false)
const pollingStartTime = ref(0)
const producersList = ref<any[]>([])
const softwaresList = ref<any[]>([])

const producerOptions = computed(() => {
  return producersList.value.map((item: any) => ({
    label: `${item.name}`,
    value: item.id
  }))
})

const softwareOptions = computed(() => {
  return softwaresList.value.map((item: any) => ({
    label: `${item.name} (${item.version})`,
    value: item.id
  }))
})

const handleProducerChange = (id: string | number) => {
  const producer = producersList.value.find(item => item.id === id)
  if (producer) {
    model.hardware.number = producer.number
    model.hardware.name = producer.name
    model.hardware.brand = producer.brand
    model.hardware.model = producer.model
    model.hardware.serial = producer.serial
    model.hardware.label = producer.label
    model.hardware.dateOfProduction = producer.dateOfProduction
    model.hardware.dateOfEntry = producer.dateOfEntry
  }
}

const handleSoftwareChange = (id: string | number) => {
  const software = softwaresList.value.find(item => item.id === id)
  if (software) {
    model.software.name = software.name
    model.software.version = software.version
  }
}

let pollingTimer: any = null

const startPolling = async (registrationId: string) => {
  pollingStartTime.value = Date.now();
  pollingShow.value = true;

  const poll = async () => {
    try {
      const res = await getRegistrationById(registrationId);
      const data = res.data;
      step.value = data.step;
      status.value = data.status;
      lastUpdateTimestamp.value = dayjs(data.lastUpdateTimestamp).format('YYYY-MM-DD HH:mm:ss');

      if (step.value === 'COMPLETED' && status.value === 'COMPLETED') {
        message.success('注册完成');
        stopPolling();
        return;
      }

      const elapsedTime = Date.now() - pollingStartTime.value;
      if (elapsedTime > 5 * 60 * 1000) {
        message.error('轮询超时');
        stopPolling();
        return;
      }

      pollingTimer = setTimeout(poll, 3000);
    } catch (error) {
      console.error('轮询出错', error);
      pollingTimer = setTimeout(poll, 3000);
    }
  };

  poll();
};

const stopPolling = () => {
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
};

const handleSave = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        if (model.id) {
          message.success('修改成功');
        } else {
          model.systemProducerId = (await addSystemProducer(model.hardware))?.data?.id
          model.systemSoftwareId = (await addSystemSoftware(model.software))?.data?.id
          const res = await addRegistration(model);
          const registrationId = res?.data?.registrationId;
          if (registrationId) {
            await startPolling(registrationId);
          }
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

const handleClear = () => {
  Object.assign(model, JSON.parse(JSON.stringify(initialModel)));
  message.info('表单已重置');
};
</script>

<template>
  <div class="main-container pa-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold m-0">
        法国门店注册信息
      </h2>
      <n-button
        type="primary"
        @click="handleAdd"
      >
        新增注册
      </n-button>
    </div>

    <n-card :segmented="true">
      <n-data-table
        :columns="columns"
        :data="dataList"
        :bordered="false"
        :pagination="{ pageSize: 10 }"
        :loading="loading"
      />
    </n-card>

    <n-modal
      v-model:show="showModal"
      preset="card"
      title="门店注册信息维护"
      style="width: 900px"
    >
      <n-form
        ref="formRef"
        :model="model"
        :rules="rules"
        label-placement="left"
        label-width="160"
        require-mark-placement="right-hanging"
        size="medium"
      >
        <n-grid
          :cols="2"
          :x-gap="24"
        >
          <n-form-item-gi
            label="环境"
            path="env"
          >
            <n-select
              v-model:value="model.env"
              :options="envOptions"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="门店设备号"
            path="deviceId"
          >
            <n-input
              v-model:value="model.deviceId"
              placeholder="请输入门店设备号"
            />
          </n-form-item-gi>

          <!-- Taxpayer Information -->
          <n-form-item-gi
            label="税务主体类型"
            path="taxpayer.taxpayerType"
          >
            <n-select
              v-model:value="model.taxpayer.taxpayerType"
              :options="taxpayerTypeOptions"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="企业注册号 (SIREN)"
            path="taxpayer.siren"
          >
            <n-input
              v-model:value="model.taxpayer.siren"
              placeholder="请输入 9 位 SIREN"
            />
          </n-form-item-gi>

          <template v-if="model.taxpayer.taxpayerType === 'COMPANY'">
            <n-form-item-gi
              label="法定名称"
              path="taxpayer.companyName"
            >
              <n-input
                v-model:value="model.taxpayer.companyName"
                placeholder="请输入法定名称"
              />
            </n-form-item-gi>
            <n-form-item-gi
              label="商业名称"
              path="taxpayer.tradeName"
            >
              <n-input
                v-model:value="model.taxpayer.tradeName"
                placeholder="请输入商业名称"
              />
            </n-form-item-gi>
          </template>

          <template v-else>
            <n-form-item-gi
              label="公司名"
              path="taxpayer.personLegalName"
            >
              <n-input
                v-model:value="model.taxpayer.personLegalName"
                placeholder="请输入公司全名"
              />
            </n-form-item-gi>
            <n-form-item-gi
              label="性别"
              path="taxpayer.person.gender"
            >
              <n-select
                v-model:value="model.taxpayer.person.gender"
                :options="genderOptions"
              />
            </n-form-item-gi>
            <n-form-item-gi
              label="名 (Forename)"
              path="taxpayer.person.forename"
            >
              <n-input
                v-model:value="model.taxpayer.person.forename"
                placeholder="请输入名"
              />
            </n-form-item-gi>
            <n-form-item-gi
              label="姓 (Surname)"
              path="taxpayer.person.surname"
            >
              <n-input
                v-model:value="model.taxpayer.person.surname"
                placeholder="请输入姓"
              />
            </n-form-item-gi>
          </template>

          <n-form-item-gi
            label="法律形式"
            path="taxpayer.legalForm"
          >
            <n-input
              v-model:value="model.taxpayer.legalForm"
              placeholder="例如: SAS, SARL..."
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="APE/NAF 代码"
            path="taxpayer.nafApeCode"
          >
            <n-input
              v-model:value="model.taxpayer.nafApeCode"
              placeholder="例如: 5610C"
            />
          </n-form-item-gi>

          <n-form-item-gi
            label="财年起始日 (MM-DD)"
            path="taxpayer.fiscalYearDate"
          >
            <n-input
              v-model:value="model.taxpayer.fiscalYearDate"
              placeholder="默认 01-01"
            />
          </n-form-item-gi>

          <!-- Taxpayer Address -->
          <n-form-item-gi
            label="主体地址: 街道"
            path="taxpayer.address.street"
          >
            <n-input
              v-model:value="model.taxpayer.address.street"
              placeholder="请输入街道名称"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="主体地址: 门牌号"
            path="taxpayer.address.number"
          >
            <n-input
              v-model:value="model.taxpayer.address.number"
              placeholder="请输入门牌号"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="主体地址: 邮编"
            path="taxpayer.address.postalCode"
          >
            <n-input
              v-model:value="model.taxpayer.address.postalCode"
              placeholder="请输入邮编"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="主体地址: 城市"
            path="taxpayer.address.city"
          >
            <n-input
              v-model:value="model.taxpayer.address.city"
              placeholder="请输入城市"
            />
          </n-form-item-gi>

          <!-- Location Information -->
          <n-form-item-gi
            label="场所识别号 (SIRET)"
            path="locationSiret"
          >
            <n-input
              v-model:value="model.locationSiret"
              placeholder="请输入 14 位 SIRET"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="场所地址: 街道"
            path="locationStreet"
          >
            <n-input
              v-model:value="model.locationStreet"
              placeholder="请输入场所街道名称"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="场所地址: 门牌号"
            path="locationNumber"
          >
            <n-input
              v-model:value="model.locationNumber"
              placeholder="请输入场所门牌号"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="场所地址: 邮编"
            path="locationPostalCode"
          >
            <n-input
              v-model:value="model.locationPostalCode"
              placeholder="请输入场所邮编"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="场所地址: 城市"
            path="locationCity"
          >
            <n-input
              v-model:value="model.locationCity"
              placeholder="请输入场所城市"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="场所国家"
            path="locationCountry"
          >
            <n-input
              v-model:value="model.locationCountry"
              placeholder="默认 FR"
            />
          </n-form-item-gi>

          <!-- Hardware Information Section -->
          <n-form-item-gi :span="2">
            <n-divider title-placement="left">
              硬件信息
            </n-divider>
          </n-form-item-gi>

          <n-form-item-gi
            :span="2"
            label="快速填充硬件"
          >
            <n-select
              placeholder="请选择预设硬件"
              :options="producerOptions"
              clearable
              @update:value="handleProducerChange"
            />
          </n-form-item-gi>

          <n-form-item-gi
            label="硬件编号"
            path="hardware.number"
          >
            <n-input
              v-model:value="model.hardware.number"
              placeholder="例如: AADEN-POS-001"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="硬件名称"
            path="hardware.name"
          >
            <n-input
              v-model:value="model.hardware.name"
              placeholder="例如: AADEN POS Terminal"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="品牌"
            path="hardware.brand"
          >
            <n-input
              v-model:value="model.hardware.brand"
              placeholder="例如: Aaden"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="型号"
            path="hardware.model"
          >
            <n-input
              v-model:value="model.hardware.model"
              placeholder="例如: POS-T1-2025"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="序列号"
            path="hardware.serial"
          >
            <n-input
              v-model:value="model.hardware.serial"
              placeholder="例如: AADEN-POS-001"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="标签"
            path="hardware.label"
          >
            <n-input
              v-model:value="model.hardware.label"
              placeholder="例如: Checkout Counter 1"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="生产日期"
            path="hardware.dateOfProduction"
          >
            <n-date-picker
              v-model:formatted-value="model.hardware.dateOfProduction"
              value-format="yyyy-MM-dd"
              type="date"
              clearable
              style="width: 100%"
              placeholder="请选择生产日期"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="启用日期"
            path="hardware.dateOfEntry"
          >
            <n-date-picker
              v-model:formatted-value="model.hardware.dateOfEntry"
              value-format="yyyy-MM-dd"
              type="date"
              clearable
              style="width: 100%"
              placeholder="请选择入库日期"
            />
          </n-form-item-gi>

          <!-- Software Information Section -->
          <n-form-item-gi :span="2">
            <n-divider title-placement="left">
              软件信息
            </n-divider>
          </n-form-item-gi>

          <n-form-item-gi
            :span="2"
            label="快速填充软件"
          >
            <n-select
              placeholder="请选择预设软件"
              :options="softwareOptions"
              clearable
              @update:value="handleSoftwareChange"
            />
          </n-form-item-gi>

          <n-form-item-gi
            label="软件名称"
            path="software.name"
          >
            <n-input
              v-model:value="model.software.name"
              placeholder="请输入软件名称"
            />
          </n-form-item-gi>
          <n-form-item-gi
            label="版本"
            path="software.version"
          >
            <n-input
              v-model:value="model.software.version"
              placeholder="请输入版本号"
            />
          </n-form-item-gi>
        </n-grid>

        <n-space
          justify="end"
          class="mt-4"
        >
          <n-button @click="handleClear">
            清空
          </n-button>
          <n-button
            type="primary"
            @click="handleSave"
          >
            保存
          </n-button>
        </n-space>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="showDetailModal"
      preset="card"
      title="注册详情"
      style="width: 1000px"
    >
      <div v-if="detailModel">
        <n-tabs
          type="line"
          animated
        >
          <!-- Taxpayer Detail -->
          <n-tab-pane
            name="taxpayer"
            tab="纳税人 (Taxpayer)"
          >
            <n-descriptions
              bordered
              label-placement="left"
              :column="2"
            >
              <n-descriptions-item label="ID">
                {{ taxpayerDetail?.id }}
              </n-descriptions-item>
              <n-descriptions-item label="类型">
                <n-tag
                  type="info"
                  size="small"
                >
                  {{ taxpayerDetail?.type }}
                </n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="state">
                <n-tag
                  :type="taxpayerDetail?.state === 'COMMISSIONED' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ taxpayerDetail?.state }}
                </n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="mode">
                <n-tag
                  :type="taxpayerDetail?.mode === 'OPERATIVE' ? 'success' : 'default'"
                  size="small"
                >
                  {{ taxpayerDetail?.mode }}
                </n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="国家">
                {{ taxpayerDetail?.country }}
              </n-descriptions-item>
              <n-descriptions-item label="增值税号 (VAT)">
                {{ taxpayerDetail?.vatNumber || '-' }}
              </n-descriptions-item>

              <n-descriptions-item
                label="法定名称"
                :span="1"
              >
                {{ taxpayerDetail?.name?.legal }}
              </n-descriptions-item>
              <n-descriptions-item
                label="商业名称"
                :span="1"
              >
                {{ taxpayerDetail?.name?.trade }}
              </n-descriptions-item>

              <n-descriptions-item
                label="税务识别号 (Tax ID)"
                :span="1"
              >
                {{ taxpayerDetail?.fiscalization?.taxIdNumber }}
              </n-descriptions-item>
              <n-descriptions-item
                label="财年起始日"
                :span="1"
              >
                {{ taxpayerDetail?.fiscalization?.fiscalYearDate }}
              </n-descriptions-item>

              <n-descriptions-item
                label="地址"
                :span="2"
              >
                {{ taxpayerDetail?.address?.line?.number }} {{ taxpayerDetail?.address?.line?.street }},
                {{ taxpayerDetail?.address?.code }} {{ taxpayerDetail?.address?.city }},
                {{ taxpayerDetail?.address?.country }}
              </n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>

          <!-- Location Detail -->
          <n-tab-pane
            name="location"
            tab="场所 (Location)"
          >
            <n-descriptions
              bordered
              label-placement="left"
              :column="2"
            >
              <n-descriptions-item label="ID">
                {{ locationDetail?.id }}
              </n-descriptions-item>
              <n-descriptions-item label="state">
                <n-tag
                  :type="locationDetail?.state === 'COMMISSIONED' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ locationDetail?.state }}
                </n-tag>
              </n-descriptions-item>
              <n-descriptions-item
                label="场所标识 (Label/SIRET)"
                :span="2"
              >
                {{ locationDetail?.label }}
              </n-descriptions-item>

              <n-descriptions-item
                label="地址"
                :span="2"
              >
                {{ locationDetail?.address?.line?.number }} {{ locationDetail?.address?.line?.street }},
                {{ locationDetail?.address?.code }} {{ locationDetail?.address?.city }},
                {{ locationDetail?.address?.country }}
              </n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>

          <!-- System Detail -->
          <n-tab-pane
            name="system"
            tab="系统设备 (System)"
          >
            <n-descriptions
              bordered
              label-placement="left"
              :column="2"
            >
              <n-descriptions-item label="ID">
                {{ systemDetail?.id }}
              </n-descriptions-item>
              <n-descriptions-item label="state">
                <n-tag
                  :type="systemDetail?.state === 'COMMISSIONED' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ systemDetail?.state }}
                </n-tag>
              </n-descriptions-item>

              <n-descriptions-item label="硬件类型">
                {{ systemDetail?.producer?.type }}
              </n-descriptions-item>
              <n-descriptions-item label="硬件编号">
                {{ systemDetail?.producer?.number }}
              </n-descriptions-item>
              <n-descriptions-item label="硬件名称">
                {{ systemDetail?.producer?.details?.name }}
              </n-descriptions-item>
              <n-descriptions-item label="品牌">
                {{ systemDetail?.producer?.details?.brand }}
              </n-descriptions-item>
              <n-descriptions-item label="型号">
                {{ systemDetail?.producer?.details?.model }}
              </n-descriptions-item>
              <n-descriptions-item label="序列号">
                {{ systemDetail?.producer?.details?.serial }}
              </n-descriptions-item>
              <n-descriptions-item label="标签">
                {{ systemDetail?.producer?.details?.label }}
              </n-descriptions-item>
              <n-descriptions-item label="生产日期">
                {{ systemDetail?.producer?.details?.dateOfProduction }}
              </n-descriptions-item>
              <n-descriptions-item label="启用日期">
                {{ systemDetail?.producer?.details?.dateOfEntry }}
              </n-descriptions-item>

              <n-descriptions-item label="软件名称">
                {{ systemDetail?.software?.name }}
              </n-descriptions-item>
              <n-descriptions-item label="软件版本">
                {{ systemDetail?.software?.version }}
              </n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>
        </n-tabs>
        <n-space
          justify="end"
          class="mt-4"
        >
          <n-button
            type="primary"
            @click="showDetailModal = false"
          >
            关闭
          </n-button>
        </n-space>
      </div>
    </n-modal>

    <n-modal
      v-model:show="pollingShow"
      preset="card"
      title="注册进度轮询"
      style="width: 400px"
      :closable="step === 'COMPLETED' && status === 'COMPLETED' || (Date.now() - pollingStartTime > 300000)"
    >
      <n-space vertical>
        <div class="flex justify-between">
          <span>步骤:</span>
          <span class="font-bold">{{ stepMap[step] || step || '等待中...' }}</span>
        </div>
        <div class="flex justify-between">
          <span>状态:</span>
          <span class="font-bold">{{ status || '等待中...' }}</span>
        </div>
        <div class="flex justify-between">
          <span>最后更新:</span>
          <span>{{ lastUpdateTimestamp || '-' }}</span>
        </div>
        <n-divider />
        <div class="text-center text-gray-400 text-sm">
          每 3 秒自动刷新，直到完成或超时（5分钟）
        </div>
        <n-button
          v-if="step === 'COMPLETED' && status === 'COMPLETED' || (Date.now() - pollingStartTime > 300000)"
          type="primary"
          block
          @click="pollingShow = false"
        >
          确定
        </n-button>
      </n-space>
    </n-modal>
  </div>
</template>

<style scoped lang="scss">
.main-container {
  max-width: 1200px;
  margin: 0 auto;
}
.mb-4 {
  margin-bottom: 16px;
}
.m-0 {
  margin: 0;
}
.mt-4 {
  margin-top: 24px;
}
</style>
