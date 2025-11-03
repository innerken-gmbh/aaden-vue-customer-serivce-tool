import useUserStore from '@/store/modules/user'
import usePermissionStore from '@/store/modules/permission'
import router from '..'

const whiteRoutes: string[] = ['/login', '/404', '/403', '/500']

function usePermissionGuard() {
  router.beforeEach(async (to) => {
    if (whiteRoutes.includes(to.path)) {
      return true
    }
    const userStore = useUserStore()
    if (userStore.isTokenExpire()) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }
    const permissionStore = usePermissionStore()
    const isEmptyRoute = permissionStore.isEmptyPermissionRoute()
    if (isEmptyRoute) {
      await permissionStore.initPermissionRoute()
      return { ...to, replace: true }
    }
    // Role-based route protection: redirect to 403 if role not allowed
    const requiredRoleId = (to.meta && (to.meta as any).requiredRoleId) as number | undefined
    if (typeof requiredRoleId !== 'undefined' && userStore.roleId !== requiredRoleId) {
      return { path: '/403' }
    }
    return true
  })
}

export default usePermissionGuard
