### 目标
根据提供的 context.md、api.md 与 frontend-requirements.md，为银行对账（Finance Reconciliation）模块制定一份可落地的前端实施计划文档。计划分两大阶段：
- 第一步：建立页面与路由结构（UI 骨架、状态管理、数据模型、表单与表格框架、占位交互与状态）
- 第二步：逐个页面集成相关接口（数据获取、表单提交、文件上传、多文件批量上传、错误处理、缓存/刷新）

说明：
- 端点与调用方式：项目中已有调用方式与 endpoint（cloud-v2.aaden.io）。沿用现有请求封装（axios/fetch 实现、拦截器、错误提示等）。
- 上传文件：沿用项目中已有的上传接口/工具方法与封装（Content-Type: multipart/form-data；单文件字段名 `file`，批量字段名 `files`）。
- 仅使用 GET/POST；日期为 ISO-8601 字符串；DTO 响应，无 Map。

---

### 阶段一：建立页面与路由结构（不联通后端，先搭骨架）

#### 1. 路由与目录结构
- 路由前缀：`/recon`。
- 新增四个主页面（与文档一致）：
    1) Companies List and Save
        - Route: `/recon/companies`
        - 目录：`src/views/recon/companies/list.vue`
    2) Company Details: Accounts Management
        - Route: `/recon/company/:companyId/accounts`
        - 目录：`src/views/recon/company/accounts.vue`
    3) Account Details: Statements List and Upload
        - Route: `/recon/account/:accountId/statements`
        - 目录：`src/views/recon/account/statements.vue`
    4) Statement Details: Transactions List (+ attachments)
        - Route: `/recon/statement/:statementId/transactions`
        - 目录：`src/views/recon/statement/transactions.vue`
- 在 `src/router/routes/constants.ts` 或现有路由注册处新增以上 route 配置，加入菜单与导航（若有侧边栏/面包屑体系，按现有模式补充 name、meta、breadcrumb）。

#### 2. UI 框架与组件约定
- 使用 Naive UI（已通过 unplugin-vue-components 自动导入）。
- 通用组件：
    - 表格：`n-data-table`（或项目内封装的 Table 组件）。
    - 表单：`n-form` + `n-form-item` + `n-input` + `n-select` + `n-date-picker` + `n-upload`/自定义上传面板。
    - 反馈：`n-spin`、`n-empty`、`n-alert`、`n-modal`、`n-button`、`n-tag`、`n-badge`、`n-message`。
- 图标：沿用项目 Vuetify MDI 或 SVG Sprites（`virtual:svg-icons-register` 已注册）。

#### 3. 状态管理与数据模型（前置定义，不访问后端）
- 在 `src/repo/reconciliation/types.ts` 定义 DTO 与保存 DTO：
    - `CompanyDTO`、`DepartmentHeadDTO`、`CompanySaveDTO`
    - `ReconciliationAccountDTO`、`ReconciliationAccountSaveDTO`
    - `BankStatementDTO`
    - `BankTransactionDTO`、`TransactionBatchUploadResultDTO`
- 在 `src/vm/reconciliation` 目录下为每个页面定义 VM/composable（对齐项目 inventory 模块习惯）：
    - `useCompaniesVM.ts`
    - `useAccountsVM.ts`
    - `useStatementsVM.ts`
    - `useTransactionsVM.ts`
- VM 负责：本地状态（loading、list 数据、分页/筛选状态）、表单模型、客户端校验规则、占位的 load/save 方法（先返回 mock 数据或空实现）。

#### 4. 页面骨架细化（静态/本地态）
1) /recon/companies（公司列表与创建/编辑）
    - 顶部：新建公司按钮（弹窗表单）。
    - 列表：公司名称、备注、创建时间、部门负责人数量；空态与加载态占位。
    - 表单字段：`name`(必填)、`notes`(可选)、部门负责人（可动态增删行：`name`(必填)、`notes`(可选)）。
    - 交互：
        - 新建/编辑弹窗（编辑时预填）；
        - 保存按钮禁用逻辑、校验提示；
        - 成功/失败消息占位。

2) /recon/company/:companyId/accounts（账户管理）
    - 顶部：公司名称、备注（通过路由携带或后续请求加载，骨架期可留占位）。
    - 列表：`bankName`、`accountNumber(中间打码)`、`alias`、创建时间；空态/加载态。
    - 弹窗表单：`bankName`(必填)、`accountNumber`(必填)、`alias`(可选)。

3) /recon/account/:accountId/statements（对账单列表与上传）
    - 列表：`name`、`description`、`startDate–endDate`、`parsed`、`fileUrl(下载链接)`、创建时间。
    - 上传区域（弹窗或侧抽屉）：
        - 字段：`name`(必填)、`description`(可选)、`startDate`(必填)、`endDate`(必填且 ≥ startDate)、`file`(PDF 单文件)。
        - 展示提示：解析会触发；日期范围重叠将覆盖。
        - 上传进度条占位。

4) /recon/statement/:statementId/transactions（流水列表与附件）
    - 顶部筛选：`transactionType`、日期范围、`submissionStatus`、文本搜索（name/description/tag）。
    - 表格列：`date`、`name`、`description`、`amount`（正绿负红）、`transactionType`、`expenseType`、`tag`、`departmentHead.name`、`submissionStatus` 徽标、`attachment`（`fileName` 链接至 `fileUrl`）、操作列（上传附件、保存链接、查看/下载）。
    - 批量上传弹窗：拖拽区域、文件列表与进度、完成摘要（`attachedCount`、`unmatchedFiles`）。
    - 顶部汇总栏：按类型统计合计（客户端计算）。

#### 5. 校验与用户体验（骨架期先内置规则）
- 公司：`name` 必填 1–100；部门负责人 name 必填 1–100。
- 账户：`bankName` 必填 1–100；`accountNumber` 6–34；`alias` 0–100。
- 对账单：`name` 1–120；文件仅 PDF；大小上限 20–50MB；日期范围合法且有序。
- 附件：pdf/jpg/png；大小上限 20–50MB。
- 常见态：加载、空态、成功/失败消息、上传进度、解析状态提示。

#### 6. 国际化与可访问性
- 通过 i18n 提供 zh-CN 文案（可先直写，二期抽取）。
- 表单 `aria-*`、键盘操作与聚焦管理按项目通用组件能力走。

#### 7. 性能与结构
- 列表多时使用虚拟滚动或客户端分页（API 不分页）。
- 组件按路由懒加载，缓存页面数据（Pinia/VM 内存缓存），在成功 POST 后失效并刷新。

---

### 阶段二：逐个页面集成相关接口（联通后端）

通用约定：
- 复用现有请求封装与 baseURL（cloud-v2.aaden.io）。推荐通过环境变量：`VITE_API_BASE=https://cloud-v2.aaden.io`（或沿用项目统一配置）。
- GET/POST；文件上传使用 `multipart/form-data`，字段名严格：单文件 `file`，批量 `files`。
- 错误处理：
    - GET 支持重试按钮（非自动重试）；
    - POST 失败展示后端错误消息摘要；
    - 统一日志：记录 endpoint + 简要 payload（不含隐私）。
- 成功后刷新：POST 成功后刷新当前列表/详情；保持滚动位置与筛选状态。

#### A. 公司列表与保存（/recon/companies）
- API：
    - GET `/recon/company/list` → `CompanyDTO[]`
    - POST `/recon/company/save` with `CompanySaveDTO` → `CompanyDTO`
- 实施步骤：
    1) 在 `src/repo/reconciliation/company.repo.ts` 实现：
        - `listCompanies(): Promise<CompanyDTO[]>`
        - `saveCompany(dto: CompanySaveDTO): Promise<CompanyDTO>`
    2) 在 `useCompaniesVM.ts` 接入：
        - `load()`：加载列表；loading/empty 管理。
        - `openCreate()` / `openEdit(row)`：弹窗初始化。
        - `submit(form)`：调用 `saveCompany`，成功后关闭弹窗并刷新；toast 成功/失败。
    3) UI：将骨架表格与表单按钮联通 VM 的方法与状态。

- 客户端校验：沿用阶段一规则；提交前再做一次完整校验。

#### B. 公司账户管理（/recon/company/:companyId/accounts）
- API：
    - GET `/recon/account/list?companyId={companyId}` → `ReconciliationAccountDTO[]`
    - POST `/recon/account/save` with `ReconciliationAccountSaveDTO` → `ReconciliationAccountDTO`
- 实施步骤：
    1) `src/repo/reconciliation/account.repo.ts`：
        - `listAccounts(companyId: number): Promise<ReconciliationAccountDTO[]>`
        - `saveAccount(dto: ReconciliationAccountSaveDTO): Promise<ReconciliationAccountDTO>`
    2) `useAccountsVM.ts`：
        - 从路由读取 `companyId`。
        - `load()` 加载账户列表。
        - `openCreate()`/`openEdit(row)`/`submit(form)` 提交保存并刷新。
    3) UI：打码展示 `accountNumber` 中间位（如 `1234 **** **** 5678`）。

#### C. 账户对账单列表与上传（/recon/account/:accountId/statements）
- API：
    - GET `/recon/statement/list?accountId={accountId}` → `BankStatementDTO[]`
    - POST multipart `/recon/statement/upload`（字段：`accountId`、`description?`；部件：`file`）→ `BankStatementDTO`
- 实施步骤：
    1) `src/repo/reconciliation/statement.repo.ts`：
        - `listStatements(accountId: number): Promise<BankStatementDTO[]>`
        - `uploadStatement(form: { accountId:number; description?:string; file:File; }): Promise<BankStatementDTO>`
        - 注意：使用现有的上传封装，构建 `FormData`，严格字段名，设置 `Content-Type: multipart/form-data`（或让浏览器自动设置边界）。
    2) `useStatementsVM.ts`：
        - 从路由读取 `accountId`。
        - `load()` 加载列表。
        - `openUpload()` → 弹窗；客户端校验：PDF、大小限制、日期范围。
        - `submitUpload()`：显示上传进度（若封装支持 onUploadProgress），成功提示并刷新列表；展示“解析已触发，重叠将覆盖”的信息。

#### D. 流水列表与附件操作（/recon/statement/:statementId/transactions）
- API：
    - GET `/recon/transaction/list?statementId={statementId}` → `BankTransactionDTO[]`
    - POST multipart `/recon/transaction/upload-attachment`（字段：`transactionId`；部件：`file`）→ `BankTransactionDTO`
    - POST `/recon/transaction/save-attachment`（params：`transactionId`、`fileUrl?`、`fileName?`）→ `BankTransactionDTO`
    - POST multipart `/recon/transaction/batch-upload-attachments`（字段：`statementId`；部件：`files[]`）→ `TransactionBatchUploadResultDTO`
- 实施步骤：
    1) `src/repo/reconciliation/transaction.repo.ts`：
        - `listTransactions(statementId: number): Promise<BankTransactionDTO[]>`
        - `uploadAttachment(transactionId: number, file: File): Promise<BankTransactionDTO>`
        - `saveAttachment(params: { transactionId: number; fileUrl?: string; fileName?: string; }): Promise<BankTransactionDTO>`
        - `batchUploadAttachments(statementId: number, files: File[]): Promise<TransactionBatchUploadResultDTO>`
    2) `useTransactionsVM.ts`：
        - 从路由读取 `statementId`。
        - 状态：`filters`（type、date range、submissionStatus、query）、`list`、`loading`、`uploading`、`batch` 进度、摘要。
        - `load()`：拉取数据，计算顶部合计。
        - 单条上传：
            - 打开文件选择器/弹窗 → `uploadAttachment(tx.id, file)` → 更新行（用返回 DTO 覆盖），`submissionStatus` 变为 `SUBMITTED`。
        - 链接保存：
            - 弹窗输入 `fileUrl`/`fileName` → `saveAttachment` → 更新行。
        - 批量上传：
            - 拖拽/选择多个 → 进度条（可选整体或逐文件）→ `batchUploadAttachments(statementId, files)`；
            - 展示 `attachedCount` 与 `unmatchedFiles` 列表，支持复制/下载/再次尝试；
            - 完成后刷新列表，反映 `submissionStatus` 变化。
        - 客户端筛选：基于 `list` 做计算属性过滤与汇总。

#### E. 类型与工具的落地
- DTO 类型（在 `src/repo/reconciliation/types.ts`）：
    - 完整照抄文档字段；`date`/`startDate`/`endDate` 均为 `string`（ISO）。
- 请求工具：
    - 直接复用现有项目请求实例（与 cloud-v2.aaden.io 兼容）。
    - 文件上传：优先复用项目已有上传工具（带进度回调、错误统一处理、取消令牌等）。
    - Base URL 与鉴权：沿用项目现有机制（`import.meta.env.VITE_API_BASE` 或其他封装读取）。

#### F. 校验、状态与错误管理
- 在 VM 中集中维护：
    - `loading/empty/error` 状态；
    - 表单 `rules`；
    - 提交/上传按钮的 `disabled` 与 `loading`；
    - 成功/失败 `n-message`；
    - 失败时保留用户输入与已选择文件。

#### G. 缓存、刷新与导航
- 缓存：列表数据在 VM 层做轻量缓存（同路由二次进入直接展示缓存，后台静默刷新）。
- 失效：POST 成功后主动失效相关缓存并刷新。
- 导航：公司 → 账户 → 对账单 → 流水；面包屑联动；返回保持筛选状态与滚动位置。

---

### 代码片段参考（示意）

#### 请求封装使用（示例）
```ts
// company.repo.ts
import { http } from '@/repo/http' // 假设已有
import type { CompanyDTO, CompanySaveDTO } from './types'

export function listCompanies() {
  return http.get<CompanyDTO[]>('/recon/company/list')
}

export function saveCompany(dto: CompanySaveDTO) {
  return http.post<CompanyDTO>('/recon/company/save', dto)
}
```

```ts
// statement.repo.ts
export function uploadStatement(p: {
  accountId: number
  description?: string
  file: File
}) {
  const fd = new FormData()
  fd.set('accountId', String(p.accountId))
  if (p.description) fd.set('description', p.description)
  fd.set('file', p.file)
  return http.post<BankStatementDTO>('/recon/statement/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: prog => {/* 更新进度 */}
  })
}
```

```ts
// transaction.repo.ts（批量上传）
export function batchUploadAttachments(statementId: number, files: File[]) {
  const fd = new FormData()
  fd.set('statementId', String(statementId))
  files.forEach(f => fd.append('files', f))
  return http.post<TransactionBatchUploadResultDTO>(
    '/recon/transaction/batch-upload-attachments',
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
}
```

---

### 里程碑与验收清单
- 里程碑 M1（骨架）：
    - 路由与页面渲染完成；表格与表单 UI 就绪；本地校验与状态管理到位；空态/加载态/消息组件可用。
- 里程碑 M2（公司/账户接口）：
    - `/recon/companies` 列表+保存打通；
    - `/recon/company/:companyId/accounts` 列表+保存打通。
- 里程碑 M3（对账单接口）：
    - `/recon/account/:accountId/statements` 列表+上传打通；上传进度与解析提示；上传成功刷新列表。
- 里程碑 M4（流水与附件接口）：
    - `/recon/statement/:statementId/transactions` 列表、筛选、合计；
    - 单条附件上传/链接保存；
    - 批量上传与结果摘要；上传后刷新列表。
- 里程碑 M5（优化与收尾）：
    - i18n 文案整理；客户端分页/虚拟滚动；错误日志与埋点；缓存与失效策略；QA 用例；文档更新。

- 验收清单（与 frontend-requirements.md 对齐）：
    - 四条路由均可访问；
    - 公司/账户/对账单表单具备校验；
    - 流水表具备筛选与附件操作（含批量）；
    - 单/批量上传正确使用 `multipart/form-data` 且字段名符合约定；
    - 加载、空、成功、错误等状态清晰；
    - 关键行为埋点：公司保存、账户保存、对账单上传、附件上传、批量上传结果。

---

### 风险与注意事项
- Base URL 与部署子路径：vite `base` 若非 `/`，下载链接/静态资源路径需与 `import.meta.env.BASE_URL` 对齐；mock 中硬编码 `/admin-work` 的差异注意避免影响（本模块默认直连后端）。
- 解析延迟：`parsed` 可能最初为 false，提供刷新按钮与提示。
- 表格规模：无分页 API，客户端处理大列表需虚拟化以控内存与性能。
- 仅 INCOME/OUTCOME 两类，`expenseType` 仅 OUTCOME 生效；前端不编辑部门负责人（只读）。

---

### 开发排期建议
- 第 1 周：M1（骨架）+ M2（公司/账户）。
- 第 2 周：M3（对账单上传）+ M4（流水与附件）。
- 第 3 周：M5（优化、i18n、埋点、联调与回归）。

如需，我可以基于现有项目的请求封装与目录实际结构，输出对应的具体文件清单与样板代码（.vue 与 .ts），便于直接落地。
