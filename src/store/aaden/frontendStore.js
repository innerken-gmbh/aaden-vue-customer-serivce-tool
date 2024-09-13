import {getFrontendLogInfo, getFrontendTypes} from "./cloud-v2-api";
import {defineStore} from "pinia";
import {getNormalStore} from "./common/common";
import {computed, ref} from "vue";

const FrontendLogManager = {
    list: async function () {
        return await getFrontendLogInfo()
    }
}


export const useFrontendStore = defineStore("frontend-logs", () => {
    const frontendTypes = ref([])
    const selectedFrontendTypes = ref([])

    async function loadTypes() {
        frontendTypes.value = await getFrontendTypes()
    }

    const {
        list,
        loading,
        reload
    } = getNormalStore(FrontendLogManager, loadTypes)

    const displayList = computed(() => {
        if (selectedFrontendTypes.value.length === 0) {
            return list.value
        } else {
            return list.value.filter(it => selectedFrontendTypes.value.includes(it.frontendType))
        }
    })
    return {
        displayList,
        list, loading, reload, frontendTypes, selectedFrontendTypes
    }
})
