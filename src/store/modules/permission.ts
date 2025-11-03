import {RouteRecordRaw} from 'vue-router'
import {defineStore} from 'pinia'
import useUserStore from './user'
import router from '@/router'
import defaultRoutes from '@/router/routes/default-routes'
import {findRootPathRoute, generatorRoutes, mapTwoLevelRouter} from '../help'
import {constantRoutes} from '@/router/routes/constants'

const usePermissionStore = defineStore('permission-route', {
    state: () => {
        return {
            permissionRoutes: [] as RouteRecordRaw[],
        }
    },
    getters: {
        getPermissionSideBar(state) {
            const userStore = useUserStore()
            const roleId = userStore.roleId

            const isAllowed = (route: any): boolean => {
                const required = route?.meta?.requiredRoleId
                return typeof required === 'undefined' || required === roleId
            }
            const deepFilter = (route: any): any | null => {
                if (!route.meta || route.meta.hidden) return null
                if (!isAllowed(route)) {
                    // If parent is not allowed, do not display it, regardless of children
                    return null
                }
                let children = route.children || []
                const filteredChildren = children
                    .map((c: any) => deepFilter(c))
                    .filter((c: any) => !!c)
                if (children.length && filteredChildren.length === 0) {
                    // Parent with no visible children should be hidden
                    return null
                }
                return { ...route, children: filteredChildren }
            }

            return state.permissionRoutes
                .map((r: any) => deepFilter(r))
                .filter((r: any) => !!r)
        },
        getPermissionSplitTabs(state) {
            const userStore = useUserStore()
            const roleId = userStore.roleId
            const isAllowed = (route: any): boolean => {
                const required = route?.meta?.requiredRoleId
                return typeof required === 'undefined' || required === roleId
            }
            const deepFilter = (route: any): any | null => {
                if (!route.meta || route.meta.hidden) return null
                if (!isAllowed(route)) return null
                let children = route.children || []
                const filteredChildren = children
                    .map((c: any) => deepFilter(c))
                    .filter((c: any) => !!c)
                if (children.length && filteredChildren.length === 0) {
                    return null
                }
                return { ...route, children: filteredChildren }
            }
            return state.permissionRoutes
                .map((r: any) => deepFilter(r))
                .filter((r: any) => !!r && r.children && r.children.length > 0)
        },
    },
    actions: {
        async getRoutes(data: { userId: number; roleId: number }) {
            try {

                return generatorRoutes(defaultRoutes)

            } catch (error) {
                console.log(
                    '路由加载失败了，请清空一下Cookie和localStorage，重新登录；如果已经采用真实接口的，请确保菜单接口地址真实可用并且返回的数据格式和mock中的一样'
                )
                return []
            }
        },
        async initPermissionRoute() {
            const userStore = useUserStore()
            // 加载路由
            const accessRoutes = await this.getRoutes({
                roleId: userStore.roleId,
                userId: userStore.userId,
            })
            const mapRoutes = mapTwoLevelRouter(accessRoutes)
            mapRoutes.forEach((it: any) => {
                router.addRoute(it)
            })
            // 配置 `/` 路由的默认跳转地址
            router.addRoute({
                path: '/',
                redirect: findRootPathRoute(accessRoutes),
                meta: {
                    hidden: true,
                },
            })
            // 这个路由一定要放在最后
            router.addRoute({
                path: '/:pathMatch(.*)*',
                redirect: '/404',
                meta: {
                    hidden: true,
                },
            })
            this.permissionRoutes = [...constantRoutes, ...accessRoutes]
        },
        isEmptyPermissionRoute() {
            return !this.permissionRoutes || this.permissionRoutes.length === 0
        },
        reset() {
            this.$reset()
        },
    },
})

export default usePermissionStore
