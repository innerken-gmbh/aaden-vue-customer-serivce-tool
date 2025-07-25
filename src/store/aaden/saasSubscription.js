import {
    addProduct,
    getAllProductList,
    getAllSubscriptionList,
    getDeviceSubscriptionList
} from "./cloud-v2-api";
import {defineStore} from "pinia";
import dayjs from "dayjs";
import {groupBy, uniq} from "lodash-es";


export const useSubscriptionStore = defineStore("saas-subscription",{
    state: () => {
        return {
            show0Price: false,
            loading: false,
            deviceId: '',
            list: [],
            selectedProductCode: '',
            email: '',
            openDate: '',
            tag: '',
            status: '',
            search: false,
            allStatusList: [],
            productList: [],
        }
    },
    getters: {
        allSubscriptionList() {
            let currentList = this.list
            if (this.search) {
                if (this.deviceId) {
                    currentList = currentList.filter(it => it.deviceId === this.deviceId)
                }
                if (this.selectedProductCode) {
                    currentList = currentList.filter(it => it.productCode === this.selectedProductCode)
                }
                if (this.email) {
                    currentList = currentList.filter(it => it.customerEmail === this.email)
                }
                if (this.openDate) {
                    currentList = currentList.filter(it => dayjs(it.createTimestamp).format('YYYY-MM-DD') === dayjs(this.openDate).format('YYYY-MM-DD'))
                }
                if (this.status) {
                    currentList = currentList.filter(it => it.status === this.status)
                }
            }

            if (!this.show0Price) {
                currentList = currentList.filter(it => it.priceInfo !== 0)
            }
            return currentList
        }
    },
    actions: {
        async getProductList () {
            this.loading = true
            this.productList = (await getAllProductList()).filter(it => it.deviceId.toString() === this.deviceId.toString())
            this.loading = false
        },
        clearFilterInfo () {
            this.deviceId = ''
            this.selectedProductCode = ''
            this.email = ''
            this.status  = ''
            this.openDate = ''
        },
        async getList () {
            this.loading = true
            const res = groupBy((await getAllSubscriptionList()),'status')
            let currentList = []
            let i = 0
            for (const item in res) {
                res[item].forEach(it => {
                    it.color = colorList[i]
                })
                currentList.push(res[item])
                i = i + 1
            }
            this.list = currentList.flat()
            this.list.forEach(x => {
                x.subLinear = getDateProgressLinear(x.subscriptionStartDate,x.subscriptionEndDate)
            })
            this.allStatusList = uniq(this.list.map(it => it.status))
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
    return Math.ceil((usedDays / allDays) * 100)
}

export function formatDate (date) {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export function formatPriceDisplay (price) {
    return price / 100 + ' €'
}

export function showCurrentBillType (type) {
    return zhDate.find(it => it.value === type).name
}

const zhDate = [
    {value: 'year',name:'年'},
    {value: 'month',name:'月'},
    {value: 'day',name:'日'},
]


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

export const softProductCodeList = [
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
    {value: 'advancedReservation',name:'高级预定'},
]

export function getProductNameByCode (code) {
    return allProductCodeList.find(it => it.value === code).name
}

export const colorList = [
    '#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'
]

export const cardColorList = [
    '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9',
    '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3', '#FFE0B2', '#FFCCBC', '#D7CCC8', '#CFD8DC'
]
