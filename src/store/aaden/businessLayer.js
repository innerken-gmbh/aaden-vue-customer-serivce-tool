import {defineStore} from "pinia";
import hillo from "hillo";
import {baseUrl} from "@/store/aaden/cloud-v2-api";

export const businessLayerStore = defineStore("businessLayerStore",{
    state: () => {
        return {
            loading: false,
            search: '',
            businessLayerList: [],
            bindLayerList: [],
        }
    },
    actions: {
        async getBusinessLayerList () {
            this.loading = true
            this.businessLayerList = await getAllBusinessLayer()
            this.loading = false
        },
        async getBindBusinessLayerList () {
            this.bindLayerList = (await getAllBusinessLayer()).filter(it => it.type !== BLTyp.Shop)
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
    return (await hillo.jsonPost(baseUrl + commonPath + 'delete/' + id,{}))
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

export const colorList = [
    '#FFCDD2', '#F8BBD0', '#E1BEE7',
    '#D1C4E9', '#C5CAE9', '#BBDEFB',
    '#B3E5FC', '#B2EBF2', '#B2DFDB',
    '#C8E6C9', '#DCEDC8', '#F0F4C3',
    '#FFF9C4', '#FFECB3', '#FFE0B2',
    '#FFCCBC', '#D7CCC8', '#CFD8DC',
    '#FFFFFF'
]
