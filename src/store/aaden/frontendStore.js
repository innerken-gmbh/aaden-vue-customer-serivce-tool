import {getFrontendLogInfo, getFrontendTypes} from "./cloud-v2-api";
import {defineStore} from "pinia";
import {getNormalStore} from "./common/common";
import {computed, ref, watch} from "vue";

const FrontendLogManager = {
    list: async function () {
        return await getFrontendLogInfo()
    }
}


export const useFrontendStore = defineStore("frontend-logs", () => {
    const frontendTypes = ref([])
    const selectedFrontendTypes = ref([])
    const search = ref('')

    async function loadTypes() {
        frontendTypes.value = await getFrontendTypes()
    }

    const {
        list,
        loading,
        reload
    } = getNormalStore(FrontendLogManager, loadTypes)

    const displayList = computed(() => {
        if (search.value) {
            list.value = list.value.filter(it => it.deviceId.toString() === search.value.toString())
        }
        if (selectedFrontendTypes.value.length === 0) {
            return list.value
        } else {
            return list.value.filter(it => selectedFrontendTypes.value.includes(it.frontendType))
        }
    })
    return {
        displayList,
        list, loading, reload, frontendTypes, selectedFrontendTypes, search
    }
})
