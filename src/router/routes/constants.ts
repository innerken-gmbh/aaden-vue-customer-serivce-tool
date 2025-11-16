import { LAYOUT } from '@/store/keys'

export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      hidden: true,
    },
  },
  {
    path: '/redirect',
    component: LAYOUT,
    meta: {
      hidden: true,
      noShowTabbar: true,
    },
    children: [
      {
        path: '/redirect/:path(.*)*',
        component: () => import('@/views/redirect/index.vue'),
      },
    ],
  },
  {
    path: '/personal',
    name: 'personal',
    component: LAYOUT,
    meta: {
      title: '个人中心',
      hidden: true,
    },
    children: [
      {
        path: 'info',
        component: () => import('@/views/personal/index.vue'),
        meta: {
          title: '个人中心',
        },
      },
    ],
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/exception/404.vue'),
    meta: {
      hidden: true,
    },
  },
  {
    path: '/500',
    name: '500',
    component: () => import('@/views/exception/500.vue'),
    meta: {
      hidden: true,
    },
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/exception/403.vue'),
    meta: {
      hidden: true,
    },
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: LAYOUT,
    meta: { title: '库存管理' },
    children: [
      {
        path: 'products',
        name: 'InventoryProducts',
        component: () => import('@/views/inventory/products/list.vue'),
        meta: { title: '货品' },
      },
      {
        path: 'boms',
        name: 'InventoryBoms',
        component: () => import('@/views/inventory/boms/list.vue'),
        meta: { title: 'BOM' },
      },
      {
        path: 'stock-records',
        name: 'InventoryStockRecords',
        component: () => import('@/views/inventory/stock-records/list.vue'),
        meta: { title: '库存记录' },
      },
      {
        path: 'inbound-notices',
        name: 'InventoryInboundNotices',
        component: () => import('@/views/inventory/inbound-notices/list.vue'),
        meta: { title: '入库预告' },
      },
      {
        path: 'sales-orders',
        name: 'InventorySalesOrders',
        component: () => import('@/views/inventory/sales-orders/list.vue'),
        meta: { title: '销售订单' },
      },
      {
        path: 'intent-orders',
        name: 'InventoryIntentOrders',
        component: () => import('@/views/inventory/intent-orders/list.vue'),
        meta: { title: '意向订单' },
      },
      {
        path: 'packages',
        name: 'InventoryPackages',
        component: () => import('@/views/inventory/packages/list.vue'),
        meta: { title: '包裹记录' },
      },
      {
        path: 'stocktakes',
        name: 'InventoryStocktakes',
        component: () => import('@/views/inventory/stocktakes/list.vue'),
        meta: { title: '盘点记录' },
      },
    ],
  },
  {
    path: '/recon',
    name: 'Reconciliation',
    component: LAYOUT,
    meta: { title: '对账平台' },
    children: [
      { path: '', redirect: { name: 'ReconCompanies' }, meta: { hidden: true } },
      {
        path: 'companies',
        name: 'ReconCompanies',
        component: () => import('@/views/recon/companies/list.vue'),
        meta: { title: '公司' },
      },
      {
        path: 'company/:companyId/accounts',
        name: 'ReconAccounts',
        component: () => import('@/views/recon/company/accounts.vue'),
        meta: { title: '账户', hidden: true },
        beforeEnter: (to) => {
          const id = Number(to.params.companyId)
          if (!Number.isFinite(id) || id <= 0) {
            return { name: 'ReconAccounts', params: { companyId: 1 } }
          }
        },
      },
      {
        path: 'company/:companyId/transactions',
        name: 'ReconTransactions',
        component: () => import('@/views/recon/statement/transactions.vue'),
        meta: { title: '流水' },
        beforeEnter: (to) => {
          const id = Number(to.params.companyId)
          if (!Number.isFinite(id) || id <= 0) {
            return { name: 'ReconTransactions', params: { companyId: 1 } }
          }
        },
      },
    ],
  }
]
