import { App } from 'vue'
import { toHump } from '@/old/utils'

function adapterNaiveCss() {
  const meta = document.createElement('meta')
  meta.name = 'naive-ui-style'
  document.head.appendChild(meta)
}

function getComponentName(key: string) {
  const paths = key.split('/')
  const name = paths
    .filter((it) => !!it && it !== '.')
    .reverse()
    .find(
      (it) =>
        it !== 'dashboard.vue' &&
        it !== 'dashboard.ts' &&
        it !== 'dashboard.tsx' &&
        it !== 'dashboard.js' &&
        it !== 'dashboard.jsx'
    )
    ?.replace('.vue', '')
  return name || ''
}

export function registerComponents(app: App) {
  const components = import.meta.globEager('./**/**.{vue,tsx}')
  Object.keys(components).forEach((it: string) => {
    const component = components[it]
    app.component(component.default.name || toHump(getComponentName(it)), component.default)
  })
}

function useGlobalComponents(app: App) {
  adapterNaiveCss()
  registerComponents(app)
}

export default useGlobalComponents
