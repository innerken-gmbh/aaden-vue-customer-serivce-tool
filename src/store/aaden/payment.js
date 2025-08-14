import hillo from "hillo";
import Swal from "sweetalert2";
import i18n from "@/i18n";
import IKUtils from "innerken-js-utils";

export async function getPaymentMethod(deviceId) {
    const host = getNgrokUrl(deviceId)
    return (await hillo.get(host + '/PHP/PayMethod.php', {
        showHidden: 1
    })).content
}

export async function getUnpaidOrder(deviceId,dateRange) {
    const timespan = dateRange.join(' - ')
    const host = getNgrokUrl(deviceId)
    const list = (await hillo.get(host + '/PHP/Orders.php', {
        op: 'withSortAndFilter',
        lang: 'zh',
        timespan
    }, { timeout: 5 * 60 * 1000 })).content
    return list.filter(item => item.payMethod === '0')
}

export function getNgrokUrl (deviceId) {
    return `${location.protocol}//ik${deviceId.toString().padStart(4, '0')}.ngrok.aaden.io`
}


export async function getDetailOrderInfo (deviceId,orderId) {
    const host = getNgrokUrl(deviceId)
    return (await hillo.get(host + '/PHP/BackendData.php?op=billDetail', {
        id: orderId,
        lang: 'zh',
    }))
}

export async function loadPaymentLog(info,deviceId) {
    const host = getNgrokUrl(deviceId)
    const obj = {
        id: info.paymentId.id,
        price: info.amount,
        name: info.paymentId.name,
        icon: info.paymentId.icon,
        hash: info.index + 'p' + info.amount + 'icon' + info.paymentId.icon,
        memberCardId: null,
    }
    if (info.paymentId.id === '4') {
        // Use the couponId from the payment row
        const res = await hillo.get(host + '/PHP/MemberCard.php', {
            op: 'check',
            id: info.couponId,
            amount: 0
        })
        if (res.content && res.status !== 'bad') {
            const leftAmount = parseFloat(res.content.leftAmount)
            obj.price = leftAmount > info.amount ? info.amount : leftAmount
            obj.memberCardId = res.content.id
        } else {
            return { error: true, index: info.index, message: '优惠券码有问题' };
        }
    }
    return obj
}

export async function checkOutOrder (deviceId,dishes, paymentLog,  orderId, consumeTypeId, discountStr) {
    const host = getNgrokUrl(deviceId)
    console.log(orderId,'orderId')
    await hillo.post(
        host + '/PHP/Complex.php?op=orderFastOnOrder',
        {
            orderId: orderId,
            dishes: JSON.stringify([]),
            consumeTypeId: consumeTypeId,
            ignoreOldDish: 0,
            discountStr: discountStr,
            paymentLog: JSON.stringify(paymentLog),
        }, { timeout: 15 * 60 * 1000 }
    )
}
