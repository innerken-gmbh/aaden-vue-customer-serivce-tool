import hillo from "hillo";
import {baseUrl} from "../cloud-v2-api";

const path = 'fiskaly/fr/'

export async function getSystemProducers () {
    return (await hillo.get(baseUrl + path + 'system-producers')).data
}

export async function getSystemProducerById (id) {
    return await hillo.get(baseUrl + path + 'system-producers/' + id)
}

export async function updateSystemProducer (id, item) {
    return await hillo.put(baseUrl + path + 'system-producers/' + id, {
        ...item,
    })
}

export async function deleteSystemProducer (id) {
    return await hillo.delete(baseUrl + path + 'system-producers/' + id)
}

export async function addSystemProducer (item) {
    return await hillo.jsonPost(baseUrl + path + 'system-producers', {
        ...item,
    })
}
