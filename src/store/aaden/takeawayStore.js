import {defineStore} from "pinia";
import hillo from "hillo";

export const takeawayStore = defineStore("takeawayStore",{
    state: () => {
        return {
            loading: false,
            search: '',
            cloudList: [],
            payMethodList: [],
        }
    },
    actions: {
        async getCloudList () {
            this.loading = true
            const dataTerminalId = (await getDataterminalByDeviceId(this.search))?.id
            this.cloudList = await getTakeawayCloudList(dataTerminalId)
            this.loading = false
        },
        async getPayMethodList () {
            this.payMethodList = await getPayMethodList(this.search)
        }
    },
})

export const acsBasePath = 'https://cloud-minus.aaden.io/'
export async function getTakeawayCloudList (dataTerminalId) {
    return (await hillo.get('https://cloud-minus.aaden.io/orders/last100By/' + dataTerminalId)).map(it => {
        it.detailInfo = JSON.parse(it.content)
        return it
    })
}

export async function getDataterminalByDeviceId (deviceId) {
    const password = deviceIdToPassword(deviceId)
    let organisationId = null

    const org = await hillo.jsonPost(acsBasePath + 'organisations/register', {
        name: password,
        password
    })
    organisationId = org.id
    return await getDataterminalByOrgId(organisationId)
}

function deviceIdToPassword (deviceId) {
    return `IK${('' + deviceId).padStart(4, '0')}`
}

async function getDataterminalByOrgId (organisationId) {
    return (await hillo.get(acsBasePath + 'dataTerminals/')).find(d => d.organisation.id === organisationId)
}

async function getPayMethodList (deviceId) {
    return (await hillo.get('https://' + deviceIdToPassword(deviceId) + '.ngrok.aaden.io/PHP/PayMethod.php?showHidden=1', {})).content
}
