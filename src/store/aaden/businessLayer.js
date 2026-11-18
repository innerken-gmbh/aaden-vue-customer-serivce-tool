import {defineStore} from "pinia";
import {erpChainBrandRequest, erpStoreBindingPost} from "./erpBackupApi";
import hillo from "hillo";
import {baseUrl} from "@/store/aaden/cloud-v2-api";
import axios from "axios";
import {transformChildrenIdsToObjects} from "@/store/aaden/common/common";
import {VSelect} from "vuetify/components";

export const businessLayerStore = defineStore("businessLayerStore",{
    state: () => {
        return {
            loading: false,
            search: '',
            BrandList: [],
            allList: [],
            treeList: [],
            bindLayerList: [],
            selectedId: ''
        }
    },
    actions: {
        async getBusinessLayerList () {
            this.loading = true
            const list = (await getAllBusinessLayer())
            this.allList = list
            this.BrandList = list.filter(it => it.type === BLTyp.Brand)
            this.loading = false
        },
        async getBindBusinessLayerList () {
            this.bindLayerList = (await getAllBusinessLayer()).filter(it => it.type !== BLTyp.Shop)
        },
        async getCurrentTreeList () {
            this.treeList = transformChildrenIdsToObjects(this.allList).filter(it => it.id === this.selectedId)
            console.log(this.treeList,'list')
        }
    },
})
const commonPath = 'common/businessLayer/'
// 新建品牌走 ERP「连锁品牌」（见 erpBackupApi.erpChainBrandRequest），只收名称；简介、logo 由品牌店主在会员后台填
export async function createBrand(name) {
    return await erpChainBrandRequest('', {method: 'POST', body: {name: (name ?? '').trim()}})
}

export async function deleteBusinessLayer(id) {
    const formData = new FormData();
    formData.append('deleteMode', 'DELETE_ALL')

    return axios.post(baseUrl + commonPath + 'delete/' + id, formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
        .then(response => {
            console.log(response.data);
        })
        .catch(error => {
            console.error(error);
        });
    //
    // return (await hillo.post(baseUrl + commonPath + 'delete/' + id,formData))
}

export async function updateBusinessLayerDisplayInfo(item) {
    return (await hillo.jsonPost(baseUrl + commonPath + 'updateDisplayInfo',{
        ...item
    }))
}

// 改上级只支持门店：挂进品牌 / 摘出品牌，都走 ERP「连锁品牌」。挂之前先看影响（会停用门店自己的会员体系、集点卡，会员转成品牌会员）
export async function previewAttachShop(brandId, deviceId) {
    return await erpChainBrandRequest(`${brandId}/attach-preview`, {query: {deviceId}})
}

export async function attachShopToBrand(brandId, deviceId) {
    return await erpChainBrandRequest(`${brandId}/shops`, {method: 'POST', body: {deviceId}})
}

export async function detachShopFromBrand(shopId) {
    return await erpChainBrandRequest(`shops/${shopId}/detach`, {method: 'POST'})
}

export async function getAllBusinessLayer() {
    const allList = (await hillo.get(baseUrl + commonPath + 'all',{}))
        allList.forEach(it => {
        it.color = it.displayInfo.color
        it.name = it.displayInfo.name ? it.displayInfo.name : it.deviceId
        it.description = it.displayInfo.description
        it.parentDisplay = allList.find(x => x.id === it.parentId)?.displayInfo.name ?? ''
        return it
    })
    return allList
}

export async function saveFile (file) {
    return (await hillo.postWithUploadFile('https://cloud-v2.aaden.io/uploadFile', {
        file
    }))
}


export const BLTyp = {
    Brand: 'Brand',
    Normal: 'Normal',
    Shop: 'Shop',
}

export const BLTypeArray = ['Brand','Normal','Shop']

// 门店绑定类操作走 ERP 登录 + 角色校验的 /erp/store-bindings（见 erpBackupApi.erpStoreBindingPost）
export async function createInvite (item) {
    return await erpStoreBindingPost('user-bl/invite', {body: {...item}})
}

export async function createAppInvite (item) {
    return await erpStoreBindingPost('user-stores/invite', {body: {...item}})
}

export async function getShopInfo (deviceId) {
    return (await hillo.get(baseUrl + 'report' + '/shop/' + deviceId, {}))

}

export async function getShopBlId(id) {
    return (await hillo.get(baseUrl + 'common/businessLayer' + '/assureShop/' + id))
}

export const authList =
    [
        { text: 'DataCenter', value: 'DataCenter' },
        { text: 'Inventory', value: 'Inventory' },
        { text: 'Supplier', value: 'Supplier' },
        { text: 'Admin', value: 'Admin' },
        { text: 'Subscription', value: 'Subscription' },
        { text: 'Owner', value: 'Owner' }
    ]

export const inviteSchema = {
    title: '发出邀请',
    subtitle: '可要好好输入邮箱，不然又要重发一次',
    schemas: [
        {
            key: 'targetEmail',
            name: 'targetEmail',
            componentProps: {
                rules: [v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '请输入正确的邮箱地址！']
            }
        },
        {
            key: 'auth',
            name: 'auth',
            component: VSelect,
            default: [],
            componentProps: {
                multiple: true,
                items: authList,
                itemValue: 'text',
                itemTitle: 'value'
            }
        }
    ]
}


export async function bindDeviceWithMain (bindingKey,userId) {
    return await erpStoreBindingPost('user-stores/bind-main-user/' + encodeURIComponent(bindingKey) + '/' + encodeURIComponent(userId))
}

export async function bindDeviceWithoutMain (userId,deviceId) {
    return await erpStoreBindingPost('user-stores/bind', {query: {firebaseUid: userId, deviceId: deviceId}})
}

export async function setDebugInfo (info) {
    return (await hillo.jsonPost('https://reservation-api.aaden.io/reservableTable/getTableTimeDebug', info)).data
}

export async function getBindingKeyByDeviceId (deviceId) {
    return (await hillo.get(baseUrl + 'report/shop/' + deviceId, {})).bindingUUID
}

export async function unbindingDevice (deviceId, uuid) {
    return await erpStoreBindingPost('user-stores/unbind', {query: {firebaseUid: uuid, deviceId: deviceId}})
}


export async function checkDeviceUuid (deviceId) {
    return (await hillo.get(baseUrl + 'user-stores/users-by-device', {
        deviceId: deviceId
    }))
}
