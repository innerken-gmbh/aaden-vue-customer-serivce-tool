import {defineStore} from 'pinia'
import {getDeviceStatus, getEndPointUrl} from '@/old/utils/firebase'
import hillo from 'hillo'
import dayjs from 'dayjs'


export const useDeviceEchoLog = defineStore('deviceLog', {
    state: (): any => {
        return {
            loading: false,
            deviceLogs: [],
            search: '',
            currentBackendVersion: '',
            cliVersion: '',
            lastUpdateTimestamp: '',
            channels: Object.values(ChannelsInfo),
            activeChannelName: ''
        }
    },
    getters: {
        activeDeviceLogs(): any[] {
            return this.deviceLogs.filter(it => !this.search || it.deviceId.startsWith(this.search))
        }
    },
    actions: {
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
        cliVersionOk(log: any) {
            return log.cliVersion === this.cliVersion
        },
        backgroundVersionOk(log: any) {
            return log.backendVersion === this.currentBackendVersion
        },
        diskOk(log: any) {
            return parseInt(log.diskUsage.replace('%','')) < 75
        },
        async updateBackend(item: { deviceId: string; loading: boolean }) {
            console.log(item)
            const url = getEndPointUrl(item.deviceId) + 'UpdateSelf.php?op=doUpdate'
            item.loading = true
            const res = await hillo.post(url, {chaos: dayjs().valueOf()})
            console.log(res)
            await this.updateDeviceLog()
            item.loading = false
        },
    },
})

export const ChannelsInfo = {
    Stable: {name: 'Stable', color: 'green'},
    Edge: {name: 'Edge', color: 'blue'},
    Candidate: {name: 'Candidate', color: 'red'},
    Beta: {name: 'Beta', color: 'yellow'},
}

export function frontendChannel(version: string): { name: string, color: string } {
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
