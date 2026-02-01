import hillo from "hillo";
import {baseUrl} from "@/store/aaden/cloud-v2-api";

export async function getCottiApiKeyList(){
    return await hillo.jsonPost(baseUrl + 'api/gateway/keys/list', {
        managerKey: "dee7052d-8f39-404c-9e12-38f33f480ba9"
    })
}

export async function addCottiApiKey(deviceId, remark) {
    return await hillo.jsonPost(baseUrl + 'api/gateway/keys/create', {
        deviceId,
        remarks: remark,
        externalKey: '',
        managerKey: "dee7052d-8f39-404c-9e12-38f33f480ba9" // 库迪的
    })
}

export async function updateCottiApiKey(id, deviceId, remark) {
    return await hillo.jsonPost(baseUrl + 'api/gateway/keys/update/' + id, {
        deviceId,
        externalKey: '',
        remarks: remark,
        managerKey: "dee7052d-8f39-404c-9e12-38f33f480ba9"
    })
}

export async function deleteCottiApiKey(id) {
    return await hillo.jsonPost(baseUrl + 'api/gateway/keys/delete', {
        id,
        managerKey: "dee7052d-8f39-404c-9e12-38f33f480ba9"
    })
}
