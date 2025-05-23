import {defineStore} from 'pinia'
import {UserState} from '../types'
import store from '../pinia'

import Avatar from '@/assets/img_avatar.gif'
import dayjs from "dayjs";

const defaultAvatar = Avatar

const useUserStore = defineStore('user-info', {
    state: () => {
        return {
            userId: 0,
            roleId: 0,
            token: '',
            userName: '',
            nickName: '',
            avatar: defaultAvatar,
            tokenDate: null
        }
    },
    actions: {
        saveUser(userInfo: UserState) {
            return new Promise<UserState>((resolve) => {
                this.userId = userInfo.userId
                this.roleId = userInfo.roleId
                this.token = userInfo.token
                this.userName = userInfo.userName
                this.tokenDate = dayjs().add(14, 'day').valueOf()
                this.nickName = userInfo.nickName
                this.avatar = userInfo.avatar || defaultAvatar
                resolve(userInfo)
            })
        },
        isTokenExpire() {
            return !this.token || (!this.tokenDate || dayjs().valueOf() > this.tokenDate)
        },
        changeNickName(newNickName: string) {
            this.nickName = newNickName
        },
        logout() {
            return new Promise<void>((resolve) => {
                this.$reset()
                localStorage.clear()
                sessionStorage.clear()
                resolve()
            })
        },
    },
    presist: {
        enable: true,
        resetToState: true,
        option: {
            exclude: ['userName'],
        },
    },
})

export default useUserStore

export function useUserStoreContext() {
    return useUserStore(store)
}
