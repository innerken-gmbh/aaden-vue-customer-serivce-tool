import hillo from "hillo";
import {baseUrl} from "@/store/aaden/cloud-v2-api";

export async function getApiKeyList(managerKey){
    return await hillo.jsonPost(baseUrl + 'api/gateway/keys/list', {
        managerKey: managerKey
    })
}

export async function addApiKey(deviceId, remark, managerKey, externalKey) {
    return await hillo.jsonPost(baseUrl + 'api/gateway/keys/create', {
        deviceId,
        remarks: remark,
        externalKey: externalKey,
        managerKey: managerKey
    })
}

export async function updateApiKey(id, deviceId, remark, externalKey, managerKey) {
    return await hillo.jsonPost(baseUrl + 'api/gateway/keys/update/' + id, {
        deviceId,
        externalKey: externalKey,
        remarks: remark,
        managerKey: managerKey
    })
}

export async function deleteApiKey(id, managerKey) {
    return await hillo.jsonPost(baseUrl + 'api/gateway/keys/delete', {
        id,
        managerKey: managerKey
    })
}

export async function getAllManagerKey() {
    return await hillo.jsonPost(baseUrl + 'api/gateway/managers/list', {})
}
