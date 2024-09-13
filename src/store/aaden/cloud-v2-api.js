import hillo from "hillo";


export const baseUrl = "https://cloud-v2.aaden.io/"

export async function saveImageInfo(deviceId, imagePath, dishesId) {
    return await hillo.jsonPost(baseUrl + "api/dish-images/save", {
        deviceId, imagePath, dishesId
    })
}


export async function getFrontendLogInfo() {
    return await hillo.get(baseUrl + "api/frontend-logs")
}

export async function getFrontendTypes() {
    return await hillo.get(baseUrl + "api/frontend-logs/frontend-types")
}
