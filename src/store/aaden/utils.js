import hillo from "hillo";
import {getEndPointUrl} from "../../old/utils/firebase";
import {keyBy, mapValues} from "lodash-es";
import Papa from 'papaparse'
import readXlsxFile from "read-excel-file";

export function generateCorsUrl(url) {
    return "https://aaden.online/jsonProxy.php?chaos=" + new Date().getTime() + "&url=" + url
}

export async function getImageFile(url) {
    // 将Blob对象转为File对象
    const blobToFile = (blob, fileName) => {
        return new window.File([blob], fileName, {type: blob.type})
    }
    const blob = await hillo.get(generateCorsUrl(url), null, {
        responseType: 'blob'
    })
    console.log(blob)
    const srcSplit = url.split("/")
    const filename = srcSplit[srcSplit.length - 1]
    return blobToFile(blob, filename)
}

const protocol = location.protocol

export function getNgrokResourceUrl(deviceId) {
    if (deviceId > 6000 && deviceId < 9000) {
        return protocol + `//ht.api.aaden.io/ik${String(deviceId).padStart(4, '0')}/Resource/`
    }
    return protocol + `//ik${String(deviceId).padStart(4, '0')}.ngrok.aaden.io/Resource/`
}

export function getNgrokPHPUrl(deviceId) {
    if (deviceId > 6000 && deviceId < 9000) {
        return protocol + `//ht.api.aaden.io/ik${String(deviceId).padStart(4, '0')}/PHP/`
    }
    return protocol + `//ik${String(deviceId).padStart(4, '0')}.ngrok.aaden.io/PHP/`
}

export async function uploadFile(file) {
    return await hillo.postWithUploadFile("https://cloud-v2.aaden.io/" + 'uploadFile', {file})
}


async function isNgrokEnabled(deviceId) {

    try {
        const result = await hillo.get(getEndPointUrl(deviceId) + 'AccessLog.php?op=deviceId', {}, {
            timeout: 20 * 1000
        })
        if (result) {
            return true
        }
    } catch (e) {

    }
    return false


}

export async function checkNgrokStatus(deviceIds) {
    // 创建一个包含所有promise的数组
    const promises = deviceIds.map(async deviceId => {
        const isEnabled = await isNgrokEnabled(deviceId);
        return {deviceId, isEnabled};
    });

    // 等待所有promise完成，无论成功还是失败
    const results = await Promise.allSettled(promises);

    // 只保留fulfilled状态的结果，并通过lodash的keyBy转化为对象
    const fulfilledResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

    const statusMap = keyBy(fulfilledResults, 'deviceId');

    // 转化为仅包含布尔值的对象
    return mapValues(statusMap, 'isEnabled');
}

export async function saveFiles(file) {
    return  await hillo.postWithUploadFile('https://cloud-v2.aaden.io/uploadFile', {
        file: file,
    });
}

export function checkFileType (file) {
    return file.split('.').pop()
}

export const imageList = ['jepg','jpg','png','gif','svg','webp','bmp']

export function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function priceDisplay (price) {
    return price + ' €'
}
