import hillo from "hillo";
import dayjs from "dayjs";


// export const baseUrl = "https://cloud-v2.aaden.io/"
// export const baseUrl = "http://localhost:8080/"
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

export async function getDishImageByDeviceId(deviceId) {
    return await hillo.get(baseUrl + "api/dish-images/by-device/" + deviceId)
}

export async function getDishList (id) {
    if (parseFloat(id) > 6000 && parseFloat(id) < 9000) {
        return (await hillo.get('https://ht.api.aaden.io/ik' + id.padStart(4,'0')  + '/PHP/Dishes.php',{})).content
    } else {
        return (await hillo.get('https://ik' + id.padStart(4,'0') + '.ngrok.aaden.io/PHP/Dishes.php',{})).content
    }
}

export async function editDish (id,item) {
    const updateItem = item
    updateItem.id = item.dishId
    if (updateItem.file) {
        updateItem.imageExt = updateItem.file.name.split('.')[1]
    }
    if (parseFloat(id) > 6000 && parseFloat(id) < 9000) {
        return await hillo.postWithUploadFile('https://ht.api.aaden.io/ik' + id.padStart(4,'0')  + '/PHP/Dishes.php?op=update', {
                ...updateItem,
                params: JSON.stringify(updateItem)
            },
            {showLoading: false})
    } else {
        return await hillo.postWithUploadFile('https://ik' + id.padStart(4, '0') + '.ngrok.aaden.io/PHP/Dishes.php?op=update', {
                ...updateItem,
                params: JSON.stringify(updateItem)
            },
            {showLoading: false})
    }
}

export async function getLogsByDeviceId (id) {
    return (await hillo.get(baseUrl+'api/frontend-logs/by-device/' + id)).map(it => {
        it.timeDisplay = dayjs(it.timestamp).format('YYYY-MM-DD HH:mm:ss')
        return it
    }).sort((a, b) => b.timeDisplay.localeCompare(a.timeDisplay))
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

export async function getDeviceBackendList (deviceId) {
    return await hillo.get(baseUrl + 'api/backups?id=' + deviceId)
}

export async function createDeviceByAdmin (userId) {
    return await hillo.post(baseUrl + 'subscriptions/create-admin/' + userId,{})
}


export async function getAllProductList () {
    return await hillo.get(baseUrl + 'subscriptions/function/list',{})
}

export async function addProduct (productCode,deviceId) {
    return await hillo.jsonPost(baseUrl + 'subscriptions/function/add',{
        note: '',
        productCode,
        deviceId,
    })
}

export async function deleteProduct (id) {
    return await hillo.jsonPost(baseUrl + 'subscriptions/function/delete/' + id,{})
}

export async function maintenanceSchedule (item) {
    return await hillo.jsonPost(baseUrl + 'api/maintenance-schedule/schedule',{
        ...item,
    })
}
