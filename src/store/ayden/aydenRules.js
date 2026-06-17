import hillo from "hillo";
import {baseUrl} from "@/store/aaden/cloud-v2-api";
import {useRoute} from "vue-router";
import IKUtils from "innerken-js-utils";
const route = useRoute()
export const testEnv = '?env=test'
export const liveEnv = ''
export const isTest = IKUtils.getQueryString('test')
export const currentEnv = isTest === '1' ? testEnv : liveEnv

export async function getAydenRules() {
    return await hillo.jsonPost(baseUrl + 'adyen/platform/listMerchantSplitConfigurations' + currentEnv, {})
}

export async function addSplitConfigurationRule (configId, items) {
    return await hillo.jsonPost(baseUrl + 'adyen/platform/addSplitConfigurationRule/' + configId + currentEnv, {
        ...items,
    })
}

export async function removeSplitConfigurationRule (configId, ruleId) {
    return await hillo.jsonPost(baseUrl + 'adyen/platform/removeSplitConfigurationRule/' + configId + '/rule/' + ruleId + currentEnv, {})
}
