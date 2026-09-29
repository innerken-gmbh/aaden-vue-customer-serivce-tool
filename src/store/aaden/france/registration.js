import hillo from "hillo";
import {baseUrl} from "../cloud-v2-api";

const path = 'fiskaly/fr/'

export async function getRegistrations () {
    return (await hillo.get(baseUrl + path + 'registrations')).data.content
}

export async function getRegistrationById (id) {
    return await hillo.get(baseUrl + path + 'registrations/' + id)
}

export async function updateRegistration (id, item) {
    return await hillo.put(baseUrl + path + 'registrations/' + id, {
        ...item,
    })
}

export async function deleteRegistration (id) {
    return await hillo.delete(baseUrl + path + 'registrations/' + id)
}

export async function addRegistration (item) {
    return await hillo.jsonPost(baseUrl + path + 'registrations', {
        ...item,
    })
}

export async function resendRegistration (id) {
    return await hillo.jsonPost(baseUrl + path + 'registrations/' + id + '/resend')
}
