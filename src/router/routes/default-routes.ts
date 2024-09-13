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
        parentPath: '/store-management',
        menuUrl: '/store-management/manage-store',
        menuName: '查看门店界面',
      },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/upload',
        menuName: '商品批量上传(敬请期待)',
      },
      {
        parentPath: '/store-management',
        menuUrl: '/store-management/copy',
        menuName: '商品复制',
      },
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
        menuUrl: '/form/advance-form',
        menuName: '外卖订单查询(敬请期待)',
        cacheable: true,
      },
      {
        parentPath: '/form',
        menuUrl: '/form/step-form',
        menuName: '-',
      },
    ],
  },
]
