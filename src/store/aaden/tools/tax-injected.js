import {baseUrl} from "@/store/aaden/cloud-v2-api";
import hillo from "hillo";
import dayjs from "dayjs";

export async function getTaxInjectedList() {
    return await hillo.get(baseUrl + 'deviceRecord/getList')
}

export async function updateInjectedList(item) {
    return await hillo.jsonPost(baseUrl + 'deviceRecord/addOrUpdate', {
        ...item,
    })
}

export async function deleteInjectedList(id) {
    return await hillo.jsonPost(baseUrl + 'deviceRecord/delete/' + id, {
    })
}
