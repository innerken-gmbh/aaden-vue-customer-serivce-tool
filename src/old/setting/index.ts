import {AppConfigState, DeviceType, LayoutMode, PageAnim, SideTheme, ThemeMode,} from '@/store/types'

export const projectName = 'Aaden 客服平台'

export default {
  theme: ThemeMode.LIGHT,
  sideTheme: SideTheme.DARK,
  themeColor: '#409eff',
  layoutMode: LayoutMode.TTB,
  sideWidth: 210,
  deviceType: DeviceType.PC,
  pageAnim: PageAnim.OPACITY,
  isFixedNavBar: true,
  isCollapse: false,
  actionBar: {
    isShowSearch: false,
    isShowMessage: false,
    isShowRefresh: true,
    isShowFullScreen: true,
  },
} as AppConfigState
