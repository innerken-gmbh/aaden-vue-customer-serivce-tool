import hillo from "hillo";
import {baseUrl} from "../cloud-v2-api";

const path = 'fiskaly/fr/'

export async function getSystemSoftwares () {
    return (await hillo.get(baseUrl + path + 'system-software')).data
}

export async function getSystemSoftwareById (id) {
    return await hillo.get(baseUrl + path + 'system-software/' + id)
}

export async function updateSystemSoftware (id, item) {
    return await hillo.put(baseUrl + path + 'system-software/' + id, {
        name: item.name,
        version: item.version,
    })
}

export async function deleteSystemSoftware (id) {
    return await hillo.delete(baseUrl + path + 'system-software/' + id)
}

export async function addSystemSoftware (item) {
    return await hillo.jsonPost(baseUrl + path + 'system-software', {
        ...item,
    })
}
