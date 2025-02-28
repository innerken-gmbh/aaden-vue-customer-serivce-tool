import hillo from "hillo";
import {delay} from "lodash-es";
import {sleep} from "openai/core";
import {collection,addDoc} from "firebase/firestore";
import {db} from "@/old/utils/firebase";

export const cloudUrl = "https://cloud5.api.aaden.io"

export async function createDevice() {
    const res = await hillo.jsonPost(cloudUrl + '/virtualDevice/create',{})
    const deviceId = res?.data?.deviceId ?? ''
    if (res) {
        let statusOut = ''
        let step = 0
        while (statusOut !== "DeployDone" && step < 1000) {
            statusOut =  (await findDeviceByDeviceId(deviceId.toString()))?.currentStatus
            console.log(statusOut,'statusOut')
            if (statusOut !== "DeployDone") {
                await sleep(3 * 1000)
            }
            step++
        }
    }
    return deviceId
}

export async function findDeviceByDeviceId (deviceId) {
    try {
        return (await hillo.jsonPost(cloudUrl + '/virtualDevice/search', { deviceId })).data?.[0]
    } catch (e) {
        console.log(e)
        return null
    }
}

const userAndStoreRelation = 'userStore'

export async function bindStoreToUser (userId,deviceId,admin) {
    return await addDoc(collection(db, userAndStoreRelation), {
        userId,
        deviceId,
        admin
    })
}

export async function getTestDevice(userId){
    const deviceId = await createDevice()
    if (deviceId !== '') {
        await bindStoreToUser(userId,deviceId,true)
    }
}
