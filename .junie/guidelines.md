Project-specific guidelines for advanced contributors

Last verified: 2025-09-13 (npm run build succeeds on Node 18+)

Overview
- Stack: Vue 3 + Vite 5 + TypeScript + Naive UI + Pinia + Vue Router + TailwindCSS + Vuetify (icons/components used) + MockJS + ECharts.
- Tooling: vite-plugin-svg-icons, vite-plugin-compression, unplugin-vue-components (NaiveUiResolver), vue-tsc.
- Aliases and global styles are configured in Vite/TS.

Build and configuration
- Node/runtime
  - Use Node 18+ (Vite 5 requirement). Recommended: LTS 18 or 20.
  - Package manager: project includes package-lock.json. Prefer npm for deterministic installs; yarn also works but keep lock consistency.

- Scripts (package.json)
  - Dev: npm run dev (Vite dev server with --host, server.open=true)
  - Build (prod): npm run build (vite build)
  - Build (staging mode): npm run staging (vite build --mode staging)
  - Type check only: npm run tsc (vue-tsc --noEmit)
  - Preview built bundle: npm run serve (vite preview)

- Environments and modes
  - Vite modes: import.meta.env.MODE is used (e.g., mock/list/index.js). Provide .env files as needed (.env, .env.development, .env.staging, .env.production). Only variables prefixed with VITE_ are exposed to the client.
  - The project also depends on dotenv, but the code primarily reads from import.meta.env. If you add Node-side scripts, load .env explicitly.
  - Mock differences by mode: mock code checks MODE === 'development' for certain URL bases (e.g., avatar path includes '/admin-work' when not dev). If you deploy with a non-root base, align base and any hardcoded prefixes (see Pitfalls below).

- Vite configuration (vite.config.ts)
  - base: '/'
  - Plugins:
    - @vitejs/plugin-vue and @vitejs/plugin-vue-jsx
    - vite-plugin-svg-icons with iconDirs: src/icons, symbolId: icon-[dir]-[name]
      - Registration is done by importing 'virtual:svg-icons-register' in src/styles/index.ts. Place SVGs under src/icons/** and use <svg><use href="#icon-..."/></svg> or a helper component.
    - vite-plugin-compression with threshold 10KB (generates .gz alongside assets during build; ensure your CDN/server serves gzip if desired).
    - unplugin-vue-components (two invocations present):
      - Generic Components({ /* options */ })
      - ViteComponents with resolvers: [NaiveUiResolver()] to auto-import Naive UI components. Prefer using Naive UI components without explicit import.
  - CSS: SCSS additionalData injects @use "./src/styles/variables.scss" as *; any global SCSS variables/mixins should be placed there.
  - Resolve alias: '@/': <repo>/src/
  - Dev server: open: true; run with --host to bind to network interfaces.

- TypeScript configuration (tsconfig.json)
  - Paths: "@/*" -> "src/*" (matches Vite alias). Include .ts/.tsx/.vue.
  - Strict mode enabled; skipLibCheck true.

- Tailwind/PostCSS
  - tailwind.config.js: content globs include './src/**/*.{vue,js,ts,jsx,tsx}' and './dashboard.html'. Ensure classes in those files are discoverable by Tailwind.
  - postcss.config.js: tailwindcss + autoprefixer configured.
  - Global CSS includes src/styles/index.css and transition.css. Fonts via vfonts (Lato, FiraCode).

- Mock data setup
  - src/main.ts imports useMock() from mock/index.ts unconditionally. mock/index.ts uses import.meta.glob to load all mock modules under /mock.
  - Mock modules commonly import API URL constants from '@/old/api/url'. Requests to these endpoints are intercepted by MockJS.
  - If you need to disable mocks in production builds, gate useMock() behind an env flag, e.g. if (import.meta.env.VITE_USE_MOCK === 'true') useMock(). Currently it runs in all modes; individual mock behavior may still vary by MODE checks.

- Router/Store/Globals
  - App bootstrap (src/main.ts):
    - useAppPinia(app), useAppRouter(app), useRouterGuard(), useGlobalComponents(app)
    - Vuetify configured with mdi icons (@mdi/font) and naive-ui plugin added globally.
  - Components auto-registration: src/views/components likely registers app-wide components; Naive UI auto-import handled via unplugin-vue-components.

Local development workflow
- Install
  - npm install
- Run
  - npm run dev
  - The dev server opens automatically. To access on LAN, ensure --host is used (already in script) and check your firewall.
- Type-check
  - npm run tsc for type-only checks (recommended in CI).
- Build and preview
  - npm run build
  - npm run serve to preview the dist output locally.

Deployment notes
- Output location: dist/ (vite default). The build produced assets successfully as of the date above.
- Static compression: .gz files are emitted due to vite-plugin-compression. Configure your server (nginx, CDN) to serve precompressed assets or enable on-the-fly compression.
- Base path considerations
  - vite.config.ts sets base: '/'. If you deploy under a subpath (e.g., https://example.com/admin-work/), set base accordingly (e.g., '/admin-work/') for correct asset URLs.
  - Mock module mock/list/index.js uses '/admin-work' in certain asset paths when not in development. If you change Vite base, update these hardcoded prefixes or compute from import.meta.env.BASE_URL to avoid broken image URLs.

Coding conventions and project-specific tips
- Styling
  - Place global SCSS tokens in src/styles/variables.scss; they are auto-included via additionalData and available in every SCSS block.
  - Tailwind utility classes are available; ensure new file paths are included in tailwind.config.js content globs if you add non-standard locations.
- Imports
  - Use '@/...' alias for src. Keep tsconfig and Vite alias in sync if you refactor.
- UI libraries
  - Naive UI: components are auto-imported; do not manually register unless necessary. If IDE reports unresolved components, ensure unplugin-vue-components is active and Vite type declarations generated (components.d.ts is present).
  - Vuetify: used for certain components/icons. mdi icon set is default; ensure @mdi/font CSS remains imported in src/main.ts.
- Icons (SVG sprite)
  - Drop SVGs into src/icons, reference via symbolId icon-[dir]-[name] (e.g., #icon-user-add). Ensure 'virtual:svg-icons-register' stays imported.
- MockJS
  - For API evolutions, update '@/old/api/url' constants and corresponding mock handlers under /mock. Keep baseData in mock/base.ts aligned with your backend contract.
- ECharts
  - Use the provided useEcharts helper (see dist report) if present under src/hooks or utils; prefer lazy-loading charts to keep bundle size manageable.
- Firebase/OpenAI
  - Dependencies for firebase and openai are present. If you integrate them, store secrets in env files with VITE_ prefix and never commit secrets. In client code: import.meta.env.VITE_FIREBASE_API_KEY, etc.

Debugging and known pitfalls
- Auto-imports
  - unplugin-vue-components runs twice (Components and ViteComponents). While harmless, avoid adding a third duplicate. If you experience duplicate registration warnings, consolidate to a single configuration.
- Base URL mismatches
  - As noted, non-dev mock avatar path uses '/admin-work'. If deploying at '/', assets will work; if base changes, update mocks or compute from import.meta.env.BASE_URL.
- CSS/SCSS
  - If SCSS variables are not found, verify src/styles/variables.scss exists. The build will fail if the file is missing because additionalData @use is unconditional.
- TypeScript versions
  - typescript ^5.8.2 and vue-tsc ^2.1.6 are used. If upgrading, check vue-tsc compatibility matrix.
- Browserslist warning
  - You may see "Browserslist data is X months old" during build. Run npx update-browserslist-db@latest locally to refresh; not required for CI.

Project structure notes
- Entry: src/main.ts -> mounts App.vue, applies router, store, mocks, vuetify, naive-ui.
- Global styles bootstrap: src/styles/index.ts (includes tailwind and svg icon registration, plus iconfont CSS under src/old/icons/iconfont/iconfont.css).
- Mock suite: mock/**/*.ts|js loaded dynamically via import.meta.glob.

CI/CD suggestions (if adding later)
- Steps:
  - npm ci
  - npm run tsc
  - npm run build
  - Upload dist/ with correct base configured via --base or Vite config. Serve precompressed .gz if supported.

Appendix: quick commands
- Development: npm install && npm run dev
- Type check: npm run tsc
- Production build: npm run build
- Staging build: npm run staging
- Preview: npm run serve
