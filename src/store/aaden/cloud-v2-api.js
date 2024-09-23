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

export async function editDish (id,item) {
    const updateItem = item
    updateItem.id = item.dishId
    if (updateItem.file) {
        updateItem.imageExt = updateItem.file.name.split('.')[1]
    }
    return await hillo.postWithUploadFile('https://ik' + id.padStart(4, '0') + '.ngrok.aaden.io/PHP/Dishes.php?op=update', {
            ...updateItem,
            params: JSON.stringify(updateItem)
        },
        {showLoading: false})
}

export async function getLogsByDeviceId (id) {
    return await hillo.get(baseUrl+'api/frontend-logs/by-device/' + id)
}

export async function getDeviceLogByDeviceId(id) {
    return await hillo.get(baseUrl+'deviceLog/' + id)
}

export async function getAllSubscriptionList () {
    return (await hillo.get(baseUrl + 'subscriptions/all')).filter(it => it.productCode).filter(it => it.deviceId)
}

export async function getDeviceSubscriptionList (id) {
    return await hillo.get(baseUrl + 'subscriptions/by-device/' + id)
}
