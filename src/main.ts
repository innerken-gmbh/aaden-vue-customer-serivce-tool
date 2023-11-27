import { createApp } from 'vue'
import App from './App.vue'
import './styles'
import useGlobalComponents from './components'
import { useAppRouter } from './router'
import useRouterGuard from './router/guard'
import useAppPinia from './store'
import useMock from '../mock'
// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import zh from 'dayjs/locale/zh'

const vuetify = createVuetify({
  components,
  directives,
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
  app.mount('#app')
}

vawBoot()
