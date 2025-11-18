import {defineStore} from "pinia";
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
export async function createBusinessLayer(item) {
    return (await hillo.jsonPost(baseUrl + commonPath + 'create',{
        ...item
    }))
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

export async function updateBusinessLayerParent(item) {
    return (await hillo.jsonPost(baseUrl + commonPath + 'updateParent',{
        ...item
    }))
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

export async function createInvite (item) {
    return (await hillo.jsonPost(baseUrl + 'user-bl' + '/invite', { ...item }))
}

export async function createAppInvite (item) {
    return (await hillo.jsonPost(baseUrl + 'user-stores' + '/invite', { ...item }))
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
    return (await hillo.post(baseUrl + 'user-stores/bind-main-user/' + bindingKey + '/' + userId, {}))
}

export async function bindDeviceWithoutMain (userId,deviceId) {
    return (await hillo.post(baseUrl + 'user-stores/bind', {
        firebaseUid: userId,
        deviceId: deviceId
    }))
}
