import {getAllSubscriptionList, getDeviceSubscriptionList} from "./cloud-v2-api";
import {defineStore} from "pinia";
import dayjs from "dayjs";


export const useSubscriptionStore = defineStore("saas-subscription",{
    state: () => {
        return {
            loading: false,
            deviceId: '',
            list: [],
            selectedProductCode: '',
            email: '',
            openDate: '',
            tag: '',
            search: false
        }
    },
    getters: {
        allFilterInfo() {
            let res = ''
            if (this.deviceId) {
                res += '设备Id:' + this.deviceId + ','
            }
            if (this.selectedProductCode) {
                res += '产品名称:' + allProductCodeList.find(it => it.value === this.selectedProductCode).name + ','
            }
            if (this.email) {
                res += '客户邮箱:' + this.email + ','
            }
            if (this.openDate) {
                res += '开通时间:' + this.openDate + ','
            }
            return res
        },
        allSubscriptionList() {
            if (this.search) {
                if (this.deviceId) {
                    this.list = this.list.filter(it => it.deviceId === this.deviceId)
                }
                if (this.selectedProductCode) {
                    this.list = this.list.filter(it => it.productCode === this.selectedProductCode)
                }
                if (this.email) {
                    this.list = this.list.filter(it => it.customerEmail === this.email)
                }
                if (this.openDate) {
                    this.list = this.list.filter(it => dayjs(it.createTimestamp).format('YYYY-MM-DD') === dayjs(this.openDate).format('YYYY-MM-DD'))
                }
            }
            return this.list
        }
    },
    actions: {
        clearFilterInfo () {
            this.deviceId = ''
            this.selectedProductCode = ''
            this.email = ''
        },
        async getList () {
            this.loading = true
            this.list = (await getAllSubscriptionList())
            this.loading = false
        },
        async getCurrentListByDeviceId (id) {
            this.loading = true
            this.list = await getDeviceSubscriptionList(id)
            this.loading = false
        }
    },
})

export function getZHProductName (productCode) {
    return allProductCodeList.find(it => it.value === productCode).name
}

export function getDateProgressLinear (startDate,endDate) {
    const usedDays = dayjs().diff(dayjs(startDate),'day')
    const allDays = dayjs(endDate).diff(dayjs(startDate),'day')
    return (usedDays / allDays) * 100
}

export function formatDate (date) {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export const allProductCodeList = [
    {value: 'base',name:'基础包'},
    {value: 'tse',name:'TSE'},
    {value: 'restaurant',name:'餐馆功能'},
    {value: 'advanceSales',name:'高级零售功能'},
    {value: 'staffManagement',name:'员工管理'},
    {value: 'sales',name:'营销功能'},
    {value: 'cashbook',name:'现金帐'},
    {value: 'boss',name:'老板端APP'},
    {value: 'reservation',name:'预定功能'},
    {value: 'saleAnalysis',name:'高级销售分析'},
    {value: 'inventory',name:'库存系统'},
    {value: 'cashmanage',name:'资金管理'},
    {value: 'takeawayWeb',name:'外卖网站'},
    {value: 'scanToOrder',name:'扫码点餐'},
    {value: 'queneNumber',name:'叫号系统'},
    {value: 'kitchenMonitor',name:'厨房显示器'},
    {value: 'hotpotSystem',name:'火锅传菜系统'},
    {value: 'lcMobile',name:'手机'},
    {value: 'lcPad',name:'SamSung Pad'},
    {value: 'sWebsite',name:'网站制作'},
    {value: 'sApp',name:'门店App制作'},
    {value: 'sPrinterSetting',name:'打印机设置服务'},
    {value: 'sProService',name:'专家服务'},
    {value: 'sGoodService',name:'尊享服务'},
    {value: 'hd5',name:'D5餐饮版主机'},
    {value: 'hsunmi',name:'Aaden Max主机'},
    {value: 'hCard',name:'刷卡机'},
    {value: 'hCashBox',name:'钱箱'},
    {value: 'sSamsung',name:'SamSung Pad'},
    {value: 'sEpsonTmT30',name:'Partner 小票打印机'},
    {value: 'oldDevice',name:'Aaden老用户独享+额外TSE'},
    {value: 'openDevice',name:'开通'},
    {value: 'webService',name:'网站维护'},
    {value: 'extraStore',name:'额外许可'},
    {value: 'hStickerPrinter',name:'标签打印机'},
    {value: 'hWifiPrinter',name:'无线打印机'},
    {value: 'hPhone',name:'手机'},
]

export function getProductNameByCode (code) {
    return allProductCodeList.find(it => it.value === code).name
}
