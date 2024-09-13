import hillo from "hillo";

function generateCorsUrl(url) {
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

export async function uploadFile(file) {
    return await hillo.postWithUploadFile("https://cloud-v2.aaden.io/" + 'uploadFile', {file})
}


