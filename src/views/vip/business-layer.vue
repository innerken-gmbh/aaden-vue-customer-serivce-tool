<template>
  <div class="main-container">
    <div
      class="text-body-2 d-flex align-center justify-center pa-2"
    >
      <v-text-field
        v-model="search"
        clearable
        class="mx-2"
        hide-details
        label="DeviceId"
        prepend-inner-icon="mdi-magnify"
      />
      <v-btn
        variant="outlined"
        @click="newAdd('Brand')"
      >
        新建
      </v-btn>
    </div>
    <v-data-table
      class="pa-4"
      :search="search"
      :headers="header"
      :loading="store.loading"
      :items="store.BrandList"
    >
      <template #[`item.detail`]="{ item }">
        <v-btn
          variant="outlined"
          @click="showTree(item)"
        >
          详情
        </v-btn>
      </template>
      <template #[`item.changeParent`]="{ item }">
        <v-btn
          variant="outlined"
          @click="showChangeDialog(item,1)"
        >
          修改绑定
        </v-btn>
      </template>
      <template #[`item.changeDisplay`]="{ item }">
        <v-btn
          variant="outlined"
          @click="showChangeDialog(item,2)"
        >
          修改基本信息
        </v-btn>
      </template>
      <template #[`item.delete`]="{ item }">
        <v-btn
          variant="outlined"
          @click="deleteItem(item.id)"
        >
          删除
        </v-btn>
      </template>
    </v-data-table>
    <v-dialog
      v-model="showDetailInfo"
      max-width="800px"
    >
      <v-card class="pa-4">
        <div class="d-flex align-end">
          <div class="d-flex text-h5">
            {{ detailInfo.name }}
          </div>
          <div class="d-flex ml-4">
            ({{ detailInfo.description }})
          </div>
        </div>
        <v-row>
          <v-col cols="6">
            <div class="text-body-1 mt-4">
              基础信息
            </div>
            <div class="d-flex align-center justify-center">
              <div>
                name
              </div>
              <v-spacer />
              <div>
                {{ detailInfo.name }}
              </div>
            </div>
            <div class="d-flex align-center justify-center">
              <div>
                Description
              </div>
              <v-spacer />
              <div>
                {{ detailInfo.description }}
              </div>
            </div>
            <div class="d-flex align-center justify-center">
              <div>
                Parent
              </div>
              <v-spacer />
              <div>
                {{ detailInfo.parentDisplay }}
              </div>
            </div>
            <div class="d-flex align-center justify-center">
              <div>
                type
              </div>
              <v-spacer />
              <div>
                {{ detailInfo.type }}
              </div>
            </div>
          </v-col>
          <v-col cols="6">
            <div class="text-body-1 mt-4">
              公司信息
            </div>
            <div class="d-flex align-center justify-center">
              <div>
                legalName
              </div>
              <v-spacer />
              <div>
                {{ detailInfo.contactInfo.legalName }}
              </div>
            </div>
            <div class="d-flex align-center justify-center">
              <div>
                country
              </div>
              <v-spacer />
              <div>
                {{ detailInfo.contactInfo.country }}
              </div>
            </div>
            <div class="d-flex align-center justify-center">
              <div>
                city
              </div>
              <v-spacer />
              <div>
                {{ detailInfo.contactInfo.city }}
              </div>
            </div>
            <div class="d-flex align-center justify-center">
              <div>
                addressLine1
              </div>
              <v-spacer />
              <div>
                {{ detailInfo.contactInfo.addressLine1 }}
              </div>
            </div>
            <div class="d-flex align-center justify-center">
              <div>
                addressLine2
              </div>
              <v-spacer />
              <div>
                {{ detailInfo.contactInfo.addressLine1 }}
              </div>
            </div>
            <div class="d-flex align-center justify-center">
              <div>
                postalCode
              </div>
              <v-spacer />
              <div>
                {{ detailInfo.contactInfo.postalCode }}
              </div>
            </div>
            <div class="d-flex align-center justify-center">
              <div>
                taxNumber
              </div>
              <v-spacer />
              <div>
                {{ detailInfo.contactInfo.taxNumber }}
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="showBrandTree"
      max-width="800px"
    >
      <v-card class="pa-4">
        <tree-list
          children-key="children"
          :menus="menus"
          :tree-node-list="store.treeList"
          @selected="editInfo"
          @menu-click="menuClick"
        />
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="showAddDialog"
      max-width="800px"
    >
      <base-form
        :editing-object="editObj"
        class="pa-4"
        :schema="schema"
        @close="showAddDialog=false"
        @submit="submit"
      />
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>

import {deleteBusinessLayer,businessLayerStore,BLTypeArray,saveFile,createBrand,updateBusinessLayerDisplayInfo,previewAttachShop,attachShopToBrand,detachShopFromBrand,createInvite,inviteSchema} from "@/store/aaden/businessLayer";
import IKUtils from "innerken-js-utils";
import {ERP_CHAIN_BRANDS_PAGE} from "@/store/aaden/erpBackupApi";
import {computed, onMounted, ref, watch} from "vue";
import BaseForm from "@/views/BaseWidget/form/BaseForm.vue";
import {VFileInput, VSelect, VSwitch} from "vuetify/components";
import TreeList from "@/views/BaseWidget/basic/TreeList.vue";
import ColorPicker from "@/views/BaseWidget/basic/dialog/ColorPicker.vue";

import {useDialogStore} from "@/store/aaden/dialogStore";

const store = businessLayerStore()
const menus = [{icon: 'mdi-plus',name:'Add'},{icon: 'mdi-send',name:'Invite'},{icon: 'mdi-lead-pencil', name: 'EditBind'},{icon: 'mdi-lead-pencil', name: 'EditNormal'},{icon: 'mdi-delete',name: 'Delete'}]
const search = ref('')
const header = ref([
  {
    title: 'name',
    key: 'name',
  },
  {
    title: 'description',
    key: 'description',
  },
  // {
  //   title: 'parent',
  //   key: 'parentDisplay',
  // },
  {
    title: 'type',
    key: 'type',
  },
  {
    title: 'Public',
    key: 'public',
  },
  {
    title: 'Detail',
    key: 'detail',
  },
  {
    title: 'ChangeParent',
    key: 'changeParent',
  },
  {
    title: 'ChangeDisplay',
    key: 'changeDisplay',
  },
  {
    title: 'Delete',
    key: 'delete',
  },
])
const showAddDialog = ref(false)
const editParent = ref(false)
const editDisplayInfo = ref(false)
const showBrandTree = ref(false)
onMounted(async () => {
  await store.getBusinessLayerList()
})
const schemaType = ref('')
const schema = computed(() => {
  return [
    {
      key: 'name',
      name: 'name',
      hide: () => {
        return editParent.value
      },
    },
    {
      key: 'description',
      name: 'description',
      required: false,
      default: '',
      hide: () => {
        return editParent.value
      },
    },
    {
      key: 'imageUrl',
      name: 'imageUrl',
      required: false,
      component: VFileInput,
      hide: () => {
        return editParent.value
      },
    },
    {
      key: 'color',
      name: 'color',
      component: ColorPicker,
      required: false,
      hide: () => {
        return editParent.value
      },
    },
    {
      key: 'type',
      name: 'type',
      component: VSelect,
      componentProps: {
        // items: BLTypeArray
        items: schemaType.value === 'Brand' ? BLTypeArray.filter(it => it === 'Brand') : (schemaType.value === 'Normal' ? BLTypeArray.filter(it => it !== 'Brand') : BLTypeArray.filter(it => it === 'Shop'))
      },
    },
    {
      key: 'parentId',
      name: 'parentId',
      component: VSelect,
      required: false,
      default: parentId,
      componentProps: {
        items: store.bindLayerList.map(it => {
          it.text = it.name
          it.value = it.id
          return it
        }),
        itemValue: 'id',
        itemTitle: 'name'
      },
      hide: () => {
        return editDisplayInfo.value && schemaType.value !== 'Brand'
      },
    },
    {
      key: 'deviceId',
      name: 'deviceId',
      required: false,
      default: null,
      hide: () => {
        return editDisplayInfo.value || editParent.value && schemaType.value !== 'Brand'
      },
    },
    {
      key: 'public',
      name: 'public',
      component: VSwitch,
      default: true,
      hide: () => {
        return !editDisplayInfo.value
      },
    },
    {
      key: 'legalName',
      name: 'legalName',
      required: false,
      default: '',
      hide: () => {
        return editDisplayInfo.value || editParent.value
      },
    },
    {
      key: 'addressLine1',
      name: 'addressLine1',
      required: false,
      default: '',
      hide: () => {
        return editDisplayInfo.value || editParent.value
      },
    },
    {
      key: 'addressLine2',
      name: 'addressLine2',
      required: false,
      default: '',
      hide: () => {
        return editDisplayInfo.value || editParent.value
      },
    },
    {
      key: 'city',
      name: 'city',
      required: false,
      default: '',
      hide: () => {
        return editDisplayInfo.value || editParent.value
      },
    },
    {
      key: 'postalCode',
      name: 'postalCode',
      required: false,
      default: '',
      hide: () => {
        return editDisplayInfo.value || editParent.value
      },
    },
    {
      key: 'country',
      name: 'country',
      required: false,
      default: '',
      hide: () => {
        return editDisplayInfo.value || editParent.value
      },
    },
    {
      key: 'taxNumber',
      name: 'taxNumber',
      required: false,
      default: '',
      hide: () => {
        return editDisplayInfo.value || editParent.value
      },
    },
  ]
})

const detailInfo = ref({})
const showDetailInfo = ref(false)
const parentId = ref(null)
async function showDetail(item) {
  detailInfo.value = item
  showDetailInfo.value = true
}
const dialogStore = useDialogStore()
async function menuClick (name,node) {
  const info = store.allList.find(it => it.id === node)
  if (name === 'Add') {
    // 原来在这里建 Normal 子节点（生产从没用过）；往品牌里加门店到 ERP「连锁品牌」页按设备号挂
    IKUtils.showError('往品牌里加门店请到 ERP「租户管理 → 连锁品牌」按设备号添加：' + ERP_CHAIN_BRANDS_PAGE)
  } else if (name === 'EditBind') {
    await showChangeDialog(info, 1)
  } else if (name === 'Delete') {
    await deleteItem(node)
  } else if (name === 'EditNormal') {
    await showChangeDialog(info, 2)
  } else if (name === 'Invite') {
    const inviteInfo = await dialogStore.editItem(inviteSchema)
    inviteInfo.blId = info.id
    inviteInfo.userId = 'admin'
    await dialogStore.waitFor(async () => {
      await createInvite(inviteInfo)
    })
  }
  showBrandTree.value = false
}
async function showTree (item) {
  store.selectedId = item.id
  await store.getCurrentTreeList()
  showBrandTree.value = true
}

async function deleteItem (id) {
  await deleteBusinessLayer(id)
  await store.getBusinessLayerList()
}

async function submit (info) {
  if (info.imageUrl) {
    info.imageUrl = await saveFile(info.imageUrl)
  }
  info.contactInfo = {
    legalName: info.legalName ?? '',
    addressLine1: info.addressLine1 ?? '',
    addressLine2: info.addressLine2 ?? '',
    city: info.city ?? '',
    postalCode: info.postalCode ?? '',
    country: info.country ?? '',
    taxNumber: info.taxNumber ?? ''
  }
  info.displayInfo = {
    name: info.name,
    description: info.description ?? '',
    imageUrl: info.imageUrl ?? '',
    color: info.color ?? ''
  }
  if (!editParent.value && !editDisplayInfo.value) {
    // 新建只建连锁品牌（ERP 接口只收名称）；简介、logo 由品牌店主在会员后台「关于我们 → 品牌资料」填
    await createBrand(info.name)
  } else {
    if (editDisplayInfo.value) {
      if (typeof info.imageUrl !== 'string') {
        info.imageUrl = await saveFile(info.imageUrl)
      }
      await updateBusinessLayerDisplayInfo(info)
    }
    if (editParent.value) {
      // 取消确认时保持弹窗不关
      if (await changeShopParent(info) === false) return
    }
  }
  showAddDialog.value = false
  await store.getBusinessLayerList()
}

// 改上级：只支持门店。换品牌 = 先摘出原品牌再挂进新品牌；挂之前把影响（停用的会员体系 / 集点卡、转过去的会员数）给客服确认
async function changeShopParent (info) {
  const current = store.allList.find(it => it.id === info.id) ?? editObj.value
  const oldParent = current?.parentId ?? null
  const newParent = info.parentId || null
  if (oldParent === newParent) return
  if (current?.type !== 'Shop') {
    IKUtils.showError('只有门店能改上级（挂进品牌 / 摘出品牌）')
    throw new Error('not a shop')
  }
  if (newParent) {
    if (!current.deviceId) {
      IKUtils.showError('这家门店没有设备号，不能挂进品牌')
      throw new Error('no deviceId')
    }
    const preview = await previewAttachShop(newParent, current.deviceId)
    if (preview.currentBrand && !oldParent) {
      IKUtils.showError(`门店已在品牌「${preview.currentBrand}」里`)
      throw new Error('already in brand')
    }
    const impact = preview.impact
    const lines = [`把门店 ${current.name}（设备号 ${current.deviceId}）挂进品牌「${store.allList.find(it => it.id === newParent)?.name ?? newParent}」？`]
    if (oldParent) lines.push('会先从原品牌摘出（原品牌期间的订单留在原品牌）。')
    if (impact) {
      if (impact.ownSystems?.length) lines.push(`会停用门店自己的会员体系：${impact.ownSystems.map(it => it.name).join('、')}`)
      if (impact.ownStampCards?.length) lines.push(`会停用门店自己的集点卡：${impact.ownStampCards.map(it => it.name).join('、')}`)
      lines.push(`${impact.memberCount ?? 0} 位会员会转成品牌会员。`)
    }
    if (!window.confirm(lines.join('\n'))) return false
    if (oldParent) await detachShopFromBrand(current.id)
    await attachShopToBrand(newParent, current.deviceId)
  } else {
    if (!window.confirm(`把门店 ${current.name} 从品牌里摘出？品牌期间的订单留在品牌，不回迁。`)) return false
    await detachShopFromBrand(current.id)
  }
}

watch(showAddDialog,(value) => {
  if (!value) {
    editDisplayInfo.value = false
    editParent.value = false
    editObj.value = null
  }
},{deep:true})

async function newAdd (type) {
  schemaType.value = type
  await store.getBindBusinessLayerList()
  showAddDialog.value = true
}
const editObj = ref(null)

async function showChangeDialog (item,index) {
  editObj.value = item
  await store.getBindBusinessLayerList()
  if (index === 1) {
    editParent.value = true
  } else if (index === 2) {
    editDisplayInfo.value = true
  }
  showAddDialog.value = true
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
