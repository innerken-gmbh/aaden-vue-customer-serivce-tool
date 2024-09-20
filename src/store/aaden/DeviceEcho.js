import {defineStore} from 'pinia'
import {getDeviceStatus, getEndPointUrl, getEventListForDeviceId} from '@/old/utils/firebase'
import hillo from 'hillo'
import dayjs from 'dayjs'
import {getAllSubscriptionForStore} from "../../old/utils/firebase";
import {baseUrl, getRecentNgrokStatus} from "./cloud-v2-api";


export const useDeviceEchoLog = defineStore('deviceLog', {
    state: () => {
        return {
            loading: false,
            deviceLogs: [],
            search: '',
            currentBackendVersion: '',
            cliVersion: '',
            lastUpdateTimestamp: '',
            channels: Object.values(ChannelsInfo),
            subscriptions: [],
            recentNgrokStatus: [],
            activeChannelName: '',
            activeDevice: null,
            showDetail: false,
            eventLogs: [],
            detailLoading: false,
        }
    },
    getters: {
        activeDeviceLogs() {
            return this.deviceLogs.filter(it => !this.search || it.deviceId.startsWith(this.search))
        }
    },
    actions: {
        async selectDevice(deviceLog) {
            this.activeDevice = deviceLog
            this.showDetail = true
            this.detailLoading = true
            await this.updateEventLogs()
            this.recentNgrokStatus = await getRecentNgrokStatus(deviceLog.deviceId)
            this.detailLoading = false

        },
        async updateEventLogs() {
            this.eventLogs = await getEventListForDeviceId(this.activeDevice.deviceId)
            this.subscriptions = await getAllSubscriptionForStore(this.activeDevice.deviceId)
            console.log(this.subscriptions)
        },
        async updateDeviceLog() {
            this.loading = true
            this.deviceLogs = (await getDeviceStatus()).map(it => {
                it.channelInfo = frontendChannel(it.frontendVersion)
                return it
            })
            const {version} = await hillo.get(
                'https://api.aaden.online/proxy.php?url=https://aaden-backend.s3.eu-central-1.amazonaws.com/raw/package.json',
                {}
            )
            const {"dist-tags": cliInfo} = await hillo.get("https://registry.npmjs.org/aaden-cli")
            console.log(cliInfo.latest)
            this.cliVersion = cliInfo.latest
            this.currentBackendVersion = version
            this.lastUpdateTimestamp = dayjs().format('HH:mm:ss')
            this.loading = false
        },
        cliVersionOk(log) {
            return log.cliVersion === this.cliVersion
        },
        backgroundVersionOk(log) {
            return log.backendVersion === this.currentBackendVersion
        },
        diskOk(log) {
            return parseInt(log?.diskUsage?.replace('%', '')) < 75
        },
        async updateBackend(item) {
            console.log(item)
            const url = getEndPointUrl(item.deviceId) + 'UpdateSelf.php?op=doUpdate'
            item.loading = true
            const res = await hillo.post(url, {chaos: dayjs().valueOf()})
            console.log(res)
            await this.updateDeviceLog()
            item.loading = false
        },
        async updateDeviceLogInfo(deviceId, deviceGroup, maxVersion) {
            try {
                const dto = {
                    deviceId,
                    deviceGroup: deviceGroup ?? "",
                    maxVersion
                }
                await hillo.jsonPost(baseUrl + 'deviceLog/update', dto);
                await this.updateDeviceLog()
            } catch (error) {
                console.error('Error updating device log info:', error)
            }
        },
        async addEventLog(logInfo) {
            logInfo.type = '人工操作'
            try {
                await hillo.jsonPost(baseUrl + 'deviceLog/createEvent', logInfo);
                await this.updateEventLogs()
            } catch (error) {
                console.error('Error updating device log info:', error)
            }
        }
    },
})

export const ChannelsInfo = {
    Stable: {name: 'Stable', color: 'green'},
    Edge: {name: 'Edge', color: 'blue'},
    Candidate: {name: 'Candidate', color: 'red'},
    Beta: {name: 'Beta', color: 'yellow'},
}

export function frontendChannel(version) {
    const [major, minor] = version.split('.')
    if (major === '1') {
        return ChannelsInfo.Stable
    } else if (minor === '10') {
        return ChannelsInfo.Edge
    } else if (minor === '9') {
        return ChannelsInfo.Beta
    } else {
        return ChannelsInfo.Candidate
    }
}

export function fromNowTimestamp(timestamp) {
    return dayjs(timestamp).fromNow()
}
