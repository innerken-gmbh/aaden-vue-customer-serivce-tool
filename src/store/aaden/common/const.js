import {defineStore} from "pinia";
import {getNormalStore} from "@/js/model/common/common";
import {OrderStatus} from "@/view/fragment/dialogs/notify/notifyStore";

export const OperationTabs = {
    Out: 'Out',
    In: 'In',
    Check: 'Check',
    Produce: 'Produce'
}
export const OperatorType = {
    Internal: 'Internal',
    Cashier: 'Cashier',
    Check: 'Check',
    Loss: 'Loss',
}
export const OperationType = {
    Enter: 'Enter',
    Out: 'Out',
}

export function getGeneralStore(id, Manager) {
    return defineStore(id, () => {
        return getNormalStore(Manager)
    })
}

export const OrderAction = {
    Confirm: 'Confirm',
    Continue: 'Continue',
    Hold: 'Hold',
    PrintDelivery: 'PrintDelivery',
    ToDelivery: 'ToDelivery',
    Archive: 'Archive',
    Cancel: 'Cancel',
    PrintBill: 'PrintBill',
    GenerateBill: 'GenerateBill',
    Reject: 'Reject',
    Edit: 'Edit',
}

export const OrderActionLabel = {
    Confirm: 'Confirm',
    Continue: 'Continue',
    Hold: 'Pause',
    PrintDelivery: 'Waybill',
    ToDelivery: 'Shipping',
    Archive: 'Archive',
    Cancel: 'Cancel',
    PrintBill: 'Bill',
    GenerateBill: 'GenerateBill',
    Reject: 'Reject',
    Edit: 'Edit'
}

export const PaymentStatus = {
    NotPrint: 'NotPrint',
    WaitingForPayment: 'WaitingForPayment',
    PaymentSubmit: 'PaymentSubmit',
    PaymentSuccess: 'PaymentSuccess',
    PaymentFailed: 'PaymentFailed',
    Canceled: 'Canceled'
}

export function getPossibleOrderActions(item) {
    const actions = []
    switch (item.status) {
        case OrderStatus.Confirmed:
            actions.push(OrderAction.Hold, OrderAction.ToDelivery, OrderAction.PrintDelivery)
            break
        case OrderStatus.Created:
            actions.push(OrderAction.Confirm, OrderAction.Reject)
            break
        case OrderStatus.Completed:
            actions.push(OrderAction.Archive, OrderAction.PrintDelivery,)
            break
        case OrderStatus.Hold:
            actions.push(OrderAction.Reject, OrderAction.Continue, OrderAction.PrintDelivery,)
            break
        case OrderStatus.Delivering:
            actions.push(OrderAction.Archive, OrderAction.PrintDelivery)
            break
        default:
    }
    if ([OrderStatus.Confirmed, OrderStatus.Created, OrderStatus.Hold, OrderStatus.Delivering].includes(item.status)) {
        actions.push(OrderAction.Edit)
    }
    if ([OrderStatus.Confirmed, OrderStatus.Created, OrderStatus.Hold, OrderStatus.Delivering, OrderStatus.Completed, OrderStatus.Archive].includes(item.status)) {
        if (!item.billGenerated) {
            actions.push(OrderAction.GenerateBill)
        } else {
            actions.push(OrderAction.PrintBill)
        }
    }
    return actions
}
