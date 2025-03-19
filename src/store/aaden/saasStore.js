import {defineStore} from "pinia";
import hillo from "hillo";

export const saasStore = defineStore("saasStore",{
    state: () => {
        return {
            loading: false,
            search: '',
            storeList: [],
            detailInfo: {}
        }
    },
    actions: {
        async getStoreList () {
            this.loading = true
            this.storeList = await getAllSaaSStoreList()
            this.loading = false
        },
        async getStoreDetail(deviceId) {
            this.detailInfo = await getStoreDetailByDeviceId(deviceId)
        }
    },
})

export async function getAllSaaSStoreList() {
    return (await hillo.jsonPost('https://cloud5.api.aaden.io/virtualDevice/search',{})).data
}

export async function getStoreDetailByDeviceId(deviceId) {
    const baseUrl = 'https://ht.api.aaden.io/ik' + deviceId
    return (await hillo.post(baseUrl + '/PHP/Restaurant.php?op=view')).content[0]
}
