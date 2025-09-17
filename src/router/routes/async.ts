import { LAYOUT } from '@/store/keys'

export const asyncRoutes = [
  {
    path: '/dashboard',
    component: LAYOUT,
    name: 'Index',
    meta: {
      title: 'Dashboard',
      iconPrefix: 'iconfont',
      icon: 'dashboard',
    },
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/dashboard/main.vue'),
        meta: {
          title: '主控台',
          affix: true,
          cacheable: true,
          iconPrefix: 'iconfont',
          icon: 'menu',
        },
      },
      {
        path: 'work-place',
        name: 'WorkPlace',
        component: () => import('@/views/dashboard/work-place.vue'),
        meta: {
          title: '工作台',
          affix: true,
          iconPrefix: 'iconfont',
          icon: 'menu',
        },
      },
    ],
  },
  {
    path: '/inventory',
    component: LAYOUT,
    name: 'Inventory',
    meta: {
      title: '库存管理',
      iconPrefix: 'iconfont',
      icon: 'menu',
    },
    children: [
      {
        path: 'packages',
        name: 'InventoryPackages',
        component: () => import('@/views/inventory/packages/list.vue'),
        meta: {
          title: '包裹记录',
          cacheable: true,
          iconPrefix: 'iconfont',
          icon: 'menu',
        },
      },
    ],
  },
]
