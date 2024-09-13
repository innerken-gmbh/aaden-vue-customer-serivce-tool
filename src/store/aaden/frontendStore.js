import {getFrontendLogInfo} from "./cloud-v2-api";
import {defineStore} from "pinia";
import {getNormalStore} from "./common/common";

const FrontendLogManager = {
    list: async function () {
        return await getFrontendLogInfo()
    }
}


export const useFrontendStore = defineStore("frontend-logs", () => {
    const {
        list,
        loading,
        reload
    } = getNormalStore(FrontendLogManager)
    return {
        list, loading, reload
    }
})
