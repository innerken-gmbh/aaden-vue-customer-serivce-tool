import {createApp} from 'vue'
import App from './App.vue'
import './styles'
import useGlobalComponents from './views/components'
import {useAppRouter} from './router'
import useRouterGuard from './router/guard'
import useAppPinia from './store'
import useMock from '../mock'
// Vuetify
import 'vuetify/styles'
import {createVuetify} from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import zh from 'dayjs/locale/zh'

import {aliases, mdi} from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.min.css'
import naive from "naive-ui"; // Ensure you are using css-loader
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
})
dayjs.extend(relativeTime)
dayjs.locale(zh)
function vawBoot() {
  const app = createApp(App)
  useAppPinia(app)
  useAppRouter(app)
  useGlobalComponents(app)
  useRouterGuard()
  useMock()
  app.use(vuetify)
  app.use(naive)
  app.mount('#app')
}

vawBoot()
