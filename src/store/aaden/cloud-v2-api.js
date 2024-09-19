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

export async function getRecentNgrokStatus(deviceId) {
    return await hillo.get(baseUrl + "ngrok/" + deviceId + '/recent')
}

export async function getDishImages() {
    return await hillo.get(baseUrl + "api/dish-images")
}

export async function getDishList (id) {
    return (await hillo.get('https://ik' + id.padStart(4,'0') + '.ngrok.aaden.io/PHP/Dishes.php',{})).content
}
