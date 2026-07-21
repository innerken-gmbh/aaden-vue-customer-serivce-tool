/**
 * 这里的 defaultRoutes 是为了在一开始对接项目的时候，后端人员还没有准备好菜单接口，导致前端开发者不能进入主页面。
 * 所以这里返回默认的菜单数据，同时也向大家说明菜单数据的数据结构。后端的菜单接口一定要按这个格式去返回json数据，否则会解析菜单失败
 */
export default [
  {
    menuUrl: '/dashboard',
    menuName: 'Dashborad',
    routeName: 'dashborad',
    icon: 'icon-dashboard',
    parentPath: '',
    children: [

      {
        parentPath: '/dashboard',
        menuUrl: '/dashboard/work-place',
        menuName: '工作台',
        routeName: 'workPlace',
        isRootPath: true,
      },
    ],
  },
  {
    menuUrl: '/store-management',
    menuName: '门店管理',
    iconPrefix: 'iconfont',
    icon: 'detail',
    parentPath: '',
    children: [
      {
        parentPath: '/dashboard',
        menuUrl: '/dashboard/frontend-dashboard',
        menuName: '前端监控',
        routeName: 'frontend-dashboard',
      },
      {
        parentPath: '/dashboard',
        menuUrl: '/dashboard/check-image',
        menuName: '图库',
      },
      {
        parentPath: '/dashboard',
        menuUrl: '/dashboard/subscription-statistics',
        menuName: '订阅统计',
      },
      {
        parentPath: '/dashboard',
        menuUrl: '/dashboard/subscription-detail',
        menuName: '订阅详情',
      },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/manage-store',
        menuName: '查看门店界面',
      },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/upload',
        menuName: '商品批量上传(敬请期待)',
      },
      // {
      //   parentPath: '/store-management',
      //   menuUrl: '/store-management/copy',
      //   menuName: '商品复制',
      // },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/image-upload',
        menuName: '批量上图(敬请期待)',
      },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/sync-group',
        menuName: '修改商品同步组(敬请期待)',
      },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/edit-excel',
        menuName: '优化Excel',
      },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/get-test-store',
        menuName: '注册测试门店',
      },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/saas-store',
        menuName: '所有SaaS门店',
      },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/reservation-key',
        menuName: '预定Key'
      },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/device-bind',
        menuName: 'Admin绑定'
      },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/check-reservation',
        menuName: '预定debug写入'
      },
    ],
  },
  {
    menuUrl: '/form',
    menuName: '外卖/扫码相关',
    badge: 'dot',
    iconPrefix: 'iconfont',
    icon: 'file-text',
    parentPath: '',
    children: [
      {
        parentPath: '/form',
        menuUrl: '/form/image-to-cloud',
        menuName: '图片上云',
        cacheable: false,
      },
      {
        parentPath: '/form',
        menuUrl: '/form/takeaway/takeaway-form',
        menuName: '外卖订单查询',
        cacheable: true,
      },
      {
        parentPath: '/form',
        menuUrl: '/form/step-form',
        menuName: '-',
      },
    ],
  },
  {
    menuUrl: '/vip',
    menuName: '会员管理',
    badge: 'dot',
    iconPrefix: 'iconfont',
    icon: 'file-text',
    parentPath: '',
    children: [
      {
        parentPath: '/vip',
        menuUrl: '/vip/business-layer',
        menuName: '品牌方管理',
      },
    ],
  },
  {
    menuUrl: '/tool',
    menuName: '客服工具',
    badge: 'dot',
    iconPrefix: 'iconfont',
    icon: 'file-text',
    parentPath: '',
    children: [
      {
        parentPath: '/tool',
        menuUrl: '/tools/dishes-upload',
        menuName: '库迪上菜',
      },
      {
        parentPath: '/tool',
        menuUrl: '/tools/normal-dish-upload',
        menuName: '普通上菜',
      },
      {
        parentPath: '/tool',
        menuUrl: '/tools/dishes-check',
        menuName: '菜品校验',
      },
      {
        parentPath: '/tool',
        menuUrl: '/tools/dishes-copy',
        menuName: '菜品复制',
      },
      // {
      //   parentPath: '/tool',
      //   menuUrl: '/tools/attribute-group-upload',
      //   menuName: '属性组上传',
      // },
      {
        parentPath: '/tool',
        menuUrl: '/tools/attribute-upload',
        menuName: '属性上传',
      },
      {
        parentPath: '/tool',
        menuUrl: '/tools/attribute-bind',
        menuName: '属性绑定',
      },
      // {
      //   parentPath: '/tool',
      //   menuUrl: '/tools/normal-dishes-upload',
      //   menuName: '通用菜品上传',
      // },
      {
        parentPath: '/tool',
        menuUrl: '/tools/tax-injected',
        menuName: '改税列表',
      },
      {
        parentPath: '/tool',
        menuUrl: '/tools/cotti-key',
        menuName: '库迪Key',
      },
      {
        parentPath: '/tool',
        menuUrl: '/tools/other-key',
        menuName: '其他Key',
      },
    ],
  },
  {
    menuUrl: '/adyen',
    menuName: 'Adyen管理',
    badge: 'dot',
    iconPrefix: 'iconfont',
    icon: 'file-text',
    parentPath: '',
    children: [
      {
        parentPath: '/ayden',
        menuUrl: '/ayden/ayden-rules',
        menuName: 'Ayden规则',
      },
    ],
  },
]
