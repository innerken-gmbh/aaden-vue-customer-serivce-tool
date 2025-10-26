# 库存管理功能实现计划（多步骤任务追踪）

最后更新：2025-09-13
适用项目：Vue 3 + Vite 5 + TypeScript + Naive UI + Pinia + Vue Router + TailwindCSS + Vuetify + MockJS + ECharts
数据存储：Firebase（Firestore）

---

## 背景与目标
为现有系统新增“库存管理”模块，按照 repo/vm/view 架构组织：
- repo（数据仓库层）：与 Firebase/Firestore 交互，提供强类型 CRUD 与事务/批处理。
- vm（视图模型层）：Pinia store 或 composable，负责业务规则、状态管理、派生数据与表单校验。
- view（视图层）：Vue SFC 页面与组件，依照现有 UI 风格使用 Naive UI/Vuetify/Tailwind 实现列表、表单与详情。

目标功能：
- 货品：列表 + CRUD（字段：自动生成ID、货物编号、货物名称、备注、当前库存）
- BOM：列表 + CRUD（字段：名称、货物列表[货品*数量*备注]、备注）
- 库存操作记录：列表 + CR（字段：货品、操作类型[入库/出库]、数量、时间、备注）
- 入库预告：列表 + CRUD（字段：预计到货时间、供应商、快递追踪链接、到货状态[到货/未到货]、备注；到货后不可删改）
- 销售订单：列表 + CRUD（字段：名称、客户编号、销售单据编号、货物列表[货品*数量*备注]、备注、发货地址、期望发货时间、实际发货时间、发货状态、发货快递链接[多条逗号分隔]；新建可导入BOM；发货时必须填写链接；发货后不可修改）

---

## 数据模型（建议 Firestore 结构）
注：使用集合/文档，创建时间与更新时间统一由服务器时间戳维护（serverTimestamp）。所有集合默认包含：createdAt、updatedAt、createdBy、updatedBy。

1) products（货品）
- id: string（自动）
- code: string（货物编号，唯一）
- name: string（货物名称）
- remark: string
- stock: number（当前库存，冪等存储，来源于库存操作聚合；允许缓存字段，但真实以操作记录为准）
- isActive: boolean (默认 true)

索引建议：code 唯一；name 前缀查询索引（可选）。

2) boms（BOM）
- id: string
- name: string
- items: Array<{ productId: string; qty: number; remark?: string }>
- remark: string

3) stockRecords（库存操作记录）
- id: string
- productId: string
- type: 'IN' | 'OUT'
- qty: number (>0)
- at: Timestamp
- remark: string
- relatedType?: 'InboundNotice' | 'SalesOrder' | 'Manual'
- relatedId?: string

索引建议：productId+at，type+at。

4) inboundNotices（入库预告）
- id: string
- eta: Timestamp（预计到货时间）
- vendor: string（供应商）
- trackingUrl: string（快递追踪链接）
- status: 'ARRIVED' | 'PENDING'（到货/未到货）
- remark: string
- locked: boolean（到货后 true，用于前端禁用删除/编辑）
- arrivedAt?: Timestamp（到货时间，可选）

规则：当标记 ARRIVED 时写入库存操作记录（IN），并锁定。

5) salesOrders（销售订单）
- id: string
- name: string
- customerCode: string
- billNo: string
- items: Array<{ productId: string; qty: number; remark?: string }>
- remark: string
- shipAddress: string
- expectedShipAt?: Timestamp
- shippedAt?: Timestamp
- shipStatus: 'PENDING' | 'SHIPPED'
- shipTrackingUrls?: string（多个以逗号分隔）
- locked: boolean（发货后 true）

规则：发货时必须填写 shipTrackingUrls，落库库存操作记录（OUT），并锁定。

---

## 业务规则与约束
- 商品库存计算：
  - 可选策略A：实时聚合 stockRecords 计算得到（准确但查询成本高）。
  - 可选策略B：维持 products.stock 缓存字段，同时所有增减通过事务/批处理更新，确保与 stockRecords 一致。推荐采用 B：在 repo 层使用 runTransaction/批处理。若事务失败重试。
- 不可编辑/删除：
  - inboundNotices.status === 'ARRIVED' 后 locked=true，禁止更新/删除。
  - salesOrders.shipStatus === 'SHIPPED' 后 locked=true，禁止更新/删除。
- 发货校验：
  - 从 PENDING -> SHIPPED 的状态变化时，必须提供非空 shipTrackingUrls。
- BOM 导入：
  - 创建销售订单页支持从 BOM 选择后将其 items 复制到订单 items，可再手动调整。

---

## 架构落地（repo / vm / view）

- repo（/src/repo/inventory/*）
  - firebase.ts（公共：初始化，读取配置，导出 db、serverTimestamp、runTransaction）
  - products.repo.ts：CRUD、批量导入、唯一校验（code）、库存调整（内部使用事务更新 stock + 写 stockRecords）
  - boms.repo.ts：CRUD
  - stock-records.repo.ts：Create + 列表查询（按 productId/时间）
  - inbound-notices.repo.ts：CRUD + 到货确认（事务：写 IN 记录、更新产品 stock、锁定预告）
  - sales-orders.repo.ts：CRUD + 发货（事务：校验 tracking、写 OUT 记录、更新产品 stock、锁定订单）

- vm（/src/vm/inventory/*，Pinia store 或 composables）
  - useProductsVM.ts：列表筛选/分页、表单状态、校验
  - useBomsVM.ts
  - useStockRecordsVM.ts（只读 + 过滤）
  - useInboundNoticesVM.ts（到货按钮逻辑）
  - useSalesOrdersVM.ts（发货逻辑 + 追踪链接校验 + BOM 导入）

- view（/src/views/inventory/*）
  - products：list.vue、edit.vue（抽屉/弹窗）
  - boms：list.vue、edit.vue
  - stock-records：list.vue
  - inbound-notices：list.vue、edit.vue（到货后禁用）
  - sales-orders：list.vue、edit.vue（发货后禁用；发货对话框要求追踪链接）
  - 复用 Naive UI DataTable、Form、Modal；遵循项目风格与 Tailwind。

- 路由与导航
  - /inventory 作为父级菜单，子路由包含上述页面；在侧边栏菜单加入入口。

---

## 环境与配置
- .env(.development/.staging/.production) 添加：
  - VITE_USE_MOCK=false（如需关闭 mock）
  - VITE_FIREBASE_API_KEY、VITE_FIREBASE_AUTH_DOMAIN、VITE_FIREBASE_PROJECT_ID 等
- main.ts 中 useMock() 可根据 VITE_USE_MOCK 开关（后续实现）
- 若使用旧有 src/old/utils/firebase.ts，可抽取为 src/utils/firebase.ts 并改为从 env 读取。

---

## 里程碑与任务清单（可勾选）

M5 路由与导航
- [x] /router 下新增 routes（/inventory 及子路由）
- [x] 侧边栏菜单增加“库存管理”分组与子菜单

M1 需求与设计（输出：数据模型与用例确认）
- [ ] 明确字段、校验与边界条件（发货/到货锁定、追踪链接必填）
- [ ] 确认库存策略（事务 + 缓存 stock）与失败重试策略
- [ ] 确认 Firestore 索引需求并在 README 标注需在控制台创建

M2 基础设施
- [x] 新建 src/utils/firebase.ts，从 env 读取配置并导出 db/util
- [x] 新建 /src/repo/inventory/* 仓库模块骨架与类型定义（TypeScript interfaces）
- [x] 编写单元化仓库方法（CRUD、事务封装、错误类型）

M3 视图模型（VM）
- [x] 新建 /src/vm/inventory/* Pinia stores/composables（列表状态、表单状态、过滤、加载态）
- [x] 实现到货确认与发货操作在 VM 层的指令式 API
- [x] BOM 导入至销售订单的合并逻辑与校验

M4 视图（View）
- [x] 新建 /src/views/inventory/ 页面（Products/BOM/StockRecords/Inbound/SalesOrders）
- [x] 表格 + 表单（创建/编辑）- 已在货品页面完成基础 CRUD；其余页面待办
- [ ] 分页 + 搜索 + 批量操作（可分步）
- [ ] 发货对话框（追踪链接必填，多条用逗号）

### 视图层详细规划（按页面）

通用规范（适用于所有库存子页）
- 布局：上方工具条（搜索/批量/新增），中间 n-data-table，底部 n-pagination（受控：page、pageSize、itemCount）。✓
- 状态：loading、empty、error 显示；禁用态（进行中的请求禁用按钮/表单）。✓
- 搜索：立即搜索（输入停止 300ms 防抖）或点击“查询”触发；清空按钮重置查询与分页到第 1 页。✓
- 批量：多选行（row-key=id）；批量操作仅对“可操作状态”的记录启用，否则显示禁用提示。✓
- 路由：/inventory/*，保持面包屑与侧边菜单高亮一致；详情/编辑使用 Drawer 或 Modal，避免页面跳转。✓
- 组件：优先 Naive UI（n-data-table/n-form/n-input/n-select/n-date-picker/n-drawer/n-modal/n-pagination/n-button/n-tag），图标使用 @mdi/font。✓

1) 货品 Products（/inventory/products）
- 列表列：code（编号，唯一）、name（名称）、stock（当前库存，计算字段）、remark、updatedAt、操作。✓
- 搜索：code/name（模糊）、stock 范围（可选），排序：updatedAt desc 默认。✓
- 分页：前端受控；vm 提供 list、total、page、pageSize、setPage()、setPageSize()、refetch()。✓
- 批量：删除（仅当无锁定关联，或由 repo 校验后给出错误提示）。✓
- 表单：创建/编辑 Drawer
  - 字段：code（必填、唯一校验）、name（必填）、remark（可选）。✓
  - 校验：Pinia/vm 暴露 async validateCodeUnique(code, id?)。错误以 n-form-item 的 feedback 显示。✓
- 其他：行内“查看库存记录”快捷入口（跳转到库存记录并预设 productId 过滤）。✓

2) BOM（/inventory/bom）
- 列表列：name、itemsCount、remark、updatedAt、操作。✓
- 搜索：name 模糊；按包含 productId 过滤（可选）。✓
- 分页：同上。✓
- 批量：删除。✓
- 表单：创建/编辑 Drawer
  - 字段：name（必填）、items（至少 1 条）
    - item 行编辑：product（下拉远程搜索 products by code/name）、quantity（>0 整数）、remark（可选）
    - 新增/删除行；支持从剪贴板批量粘贴（可后续）。
  - 校验：items 至少一项且数量>0；产品不得重复（或重复时合并）。✓
- 其他：在销售订单表单中支持“从 BOM 导入”（vm 提供合并与校验已实现）。✓

3) 库存操作记录 Stock Records（/inventory/stock-records）
- 列表列：product(code+name)、type(IN/OUT)、quantity、relatedId（来源：订单/入库）、createdAt、remark。✓
- 搜索筛选：product（选择器，支持远程搜索）、type（单选）、时间范围（n-date-picker range）。✓
- 分页：时间倒序；支持导出按钮（后续，当前不做导出）。✓
- 批量：无（只读）。✓
- 其他：从产品/订单页面跳转时预设过滤条件；空状态引导至相关页面。✓

4) 入库预告 Inbound（/inventory/inbound）
- 列表列：expectDate、supplier、trackingUrl（可无）、status（未到货/已到货）、remark、updatedAt、操作（编辑/删除/标记到货）。✓
- 搜索：supplier、status、时间范围。✓
- 分页：同上。✓
- 批量：删除（仅未到货）；批量“标记到货”（确认二次弹窗，逐条调用 vm.confirmArrival）。✓
- 表单：创建/编辑 Drawer
  - 字段：expectDate（必填，日期）、supplier（必填）、trackingUrl（可选）、remark（可选）。✓
  - 规则：已到货记录锁定不可编辑/删除（操作按钮禁用并提示）。✓
- 到货动作：操作按钮“标记到货”
  - 弹窗确认：显示将写入 IN 记录、影响库存的提示；确认后调用 vm API，期间按钮 loading。✓

5) 销售订单 Sales Orders（/inventory/sales-orders）
- 列表列：orderNo、customerCode、itemsCount、shipStatus（未发货/已发货）、shipAt、trackingLinks（显示逗号分隔的首条，hover 查看全部）、updatedAt、操作（编辑/删除/发货）。✓
- 搜索：orderNo、customerCode、shipStatus、时间范围。✓
- 分页：同上。✓
- 批量：删除（仅未发货）。是否支持批量发货：默认不支持；如需，复用发货对话框并按行逐次执行。✓
- 表单：创建/编辑 Drawer
  - 字段：orderNo（必填）、customerCode（必填）、shipAddress（可选）、expectShipAt（可选日期）、remark（可选）、items（同 BOM 明细编辑器）。✓
  - 功能：从 BOM 导入（选择 BOM 后合并同品项数量；由 vm 负责合并与校验）。✓
  - 规则：已发货订单锁定不可编辑/删除。✓
- 发货对话框（核心）
  - 触发：点击“发货”按钮（仅未发货可点）。✓
  - 表单字段：trackingLinks（必填，提示多条用逗号分隔）、shipAt（默认当前时间，可修改）、remark（可选）。✓
  - 校验：trackingLinks 至少一条，去除空格；每条格式校验（http/https 开头）；错误以 n-form 展示。✓
  - 提交：调用 vm.ship(orderId,{trackingLinks[],shipAt,remark})；成功后：写 OUT 记录、订单锁定、刷新列表并给予成功提示。✓

6) 共享基础组件（建议放置 src/views/inventory/components）
- SearchBar：插槽 + 受控值，支持回车/按钮触发与重置。✓
- BatchActions：接收已选 rows 与可用动作列表，自动禁用不合规项并展示原因 tooltip。✓
- PaginationBar：双向绑定 page/pageSize/itemCount，发出 change 事件。✓
- ItemsEditor：BOM/订单共用的明细编辑器（选择产品、数量、备注、增删行）。✓
- ShipDialog：销售订单专用发货对话框（含校验与提交）。✓

7) 交互与状态细节
- Loading：列表加载中遮罩；表单提交/发货时按钮 loading；批量操作逐项进度。✓
- 空态：n-empty，提供“新建”“清空筛选”按钮。✓
- 错误：n-message.error + 表单项 feedback；Firebase 权限/事务失败给出具体文案。✓
- 可访问性：表单 labelFor、回车提交、Esc 关闭 Drawer/Modal。✓

8) 与 VM/Repo 对齐
- 所有列表通过 vm 获取数据与分页总数；搜索条件通过 vm.setFilters()；发货/到货通过 vm 暴露的命令式 API。✓
- 列表/表单的禁用规则与锁定逻辑由 vm 决策，view 只根据状态渲染。✓

9) 验收自测清单（视图层）
- 搜索 + 分页联动：更改搜索时重置到第 1 页；分页切换保持搜索条件。✓
- 批量操作：仅对可操作记录按钮启用；错误项分批提示且不中断其他项。✓
- 发货对话框：未填追踪链接拒绝提交；多条链接逗号分隔可解析；成功后列表数据同步更新并禁用编辑/删除。✓
- 样式一致：按钮尺寸/间距/标题风格与既有产品页一致。✓

### 视图层可勾选清单（按页面）

通用规范（适用于所有库存子页）
- [ ] 布局：工具条（搜索/批量/新增）+ 列表 + 分页
- [ ] 状态：loading/empty/error 显示；请求中禁用交互
- [ ] 搜索：输入300ms防抖或“查询”触发；“清空”重置并回到第1页
- [ ] 批量：多选 row-key=id；仅对“可操作状态”启用
- [ ] 路由：/inventory/* 面包屑与侧边菜单高亮一致；详情/编辑用 Drawer/Modal
- [ ] 组件：Naive UI 优先；图标使用 @mdi/font

1) 货品 Products（/inventory/products）
- [ ] 列表列：code/name/stock/remark/updatedAt/操作
- [ ] 搜索：code/name 模糊；stock 范围；默认 updatedAt desc
- [ ] 分页：受控 page/pageSize/total
- [ ] 批量：删除（校验无锁定关联）
- [ ] 表单：创建/编辑（code 必填唯一；name 必填；remark 可选）
- [ ] 校验：validateCodeUnique 提示到 n-form-item
- [ ] 其他：行内“查看库存记录”快捷入口

2) BOM（/inventory/bom）
- [ ] 列表列：name/itemsCount/remark/updatedAt/操作
- [ ] 搜索：name 模糊；按包含 productId 过滤（可选）
- [ ] 分页：受控
- [ ] 批量：删除
- [ ] 表单：name 必填；items 至少1条（product/quantity/remark，可增删行）
- [ ] 校验：数量>0；重复产品合并或报错
- [ ] 其他：销售订单表单支持“从 BOM 导入”

3) 库存操作记录 Stock Records（/inventory/stock-records）
- [ ] 列表列：product/type(IN/OUT)/quantity/relatedId/createdAt/remark
- [ ] 筛选：product 远程选择、type 单选、时间范围
- [ ] 分页：时间倒序
- [ ] 导出按钮（可后续实现）
- [ ] 只读：无批量操作

4) 入库预告 Inbound（/inventory/inbound）
- [ ] 列表列：expectDate/supplier/trackingUrl/status/remark/updatedAt/操作
- [ ] 搜索：supplier/status/时间范围
- [ ] 分页：受控
- [ ] 批量：删除（仅未到货）
- [ ] 批量“标记到货”：逐条调用 vm.confirmArrival，二次确认
- [ ] 表单：expectDate、supplier 必填；trackingUrl/remark 可选
- [ ] 规则：已到货锁定不可编辑/删除；按钮禁用提示
- [ ] 到货动作：确认弹窗 -> vm API -> 成功提示并刷新

5) 销售订单 Sales Orders（/inventory/sales-orders）
- [ ] 列表列：orderNo/customerCode/itemsCount/shipStatus/shipAt/trackingLinks/updatedAt/操作
- [ ] 搜索：orderNo/customerCode/shipStatus/时间范围
- [ ] 分页：受控
- [ ] 批量：删除（仅未发货）
- [ ] 表单：orderNo、customerCode 必填；shipAddress/expectShipAt/remark 可选；items 编辑
- [ ] 功能：从 BOM 导入（合并同品项）
- [ ] 规则：已发货锁定不可编辑/删除
- [ ] 发货对话框（核心）
  - [ ] 触发：仅未发货可点
  - [ ] 字段：trackingLinks（必填，多条逗号分隔）/shipAt（默认当前）/remark
  - [ ] 校验：至少一条；http/https 开头；去空格
  - [ ] 提交：vm.ship -> 写 OUT 记录 -> 锁定订单 -> 刷新列表 -> 成功提示

6) 共享基础组件（建议 src/views/inventory/components）
- [ ] SearchBar
- [ ] BatchActions
- [ ] PaginationBar
- [ ] ItemsEditor（BOM/订单共用）
- [ ] ShipDialog（销售订单发货）

7) 交互与状态
- [ ] Loading：列表遮罩；表单/发货按钮 loading
- [ ] 空态：n-empty + “新建”“清空筛选”
- [ ] 错误：n-message.error + 表单项 feedback；具体权限/事务文案
- [ ] 可访问性：labelFor、回车提交、Esc 关闭

8) 与 VM/Repo 对齐
- [ ] 列表与分页由 vm 提供；搜索用 vm.setFilters
- [ ] 禁用/锁定逻辑由 vm 决策，view 跟随渲染

9) 验收自测（视图层）
- [ ] 搜索变更重置到第1页；分页切换保留条件
- [ ] 批量操作仅对可操作记录启用；错误逐项提示不中断
- [ ] 发货对话框：追踪链接必填且可解析多条；成功后列表同步更新并禁用编辑/删除
- [ ] 样式一致：与产品页一致的按钮/间距/标题

M6 Mock 与开发体验（可选）
- [ ] 如需本地无 Firebase，增加 mock/*.ts 模块并由 VITE_USE_MOCK 控制
- [ ] 对列表提供本地分页/筛选模拟

M7 文档与校验
- [ ] README 补充环境变量说明与部署注意事项
- [ ] 针对关键流程编写验证清单（如下）

M8 验收与回归
- [ ] 通过验收标准（如下）
- [ ] npm run tsc 通过
- [ ] npm run build 通过；npm run serve 预览功能正常

---

## 验收标准（Acceptance Criteria）
- 货品：
  - 能创建/编辑/删除/查看，code 唯一校验；列表显示当前库存。
- BOM：
  - 能创建/编辑/删除/查看；items 至少一项且数量>0。
- 库存操作记录：
  - 能按产品与时间筛选查看；新记录写入后产品 stock 增减准确。
- 入库预告：
  - 能创建/编辑/删除；当标记到货时，自动写 IN 记录并锁定不可编辑/删除。
- 销售订单：
  - 能创建/编辑/删除；发货时必须填写追踪链接，自动写 OUT 记录并锁定不可编辑/删除。
- 事务一致性：
  - 并发入库/出库不造成库存错乱；库存与操作记录保持一致。
- UI/UX：
  - 页面风格与既有项目一致；错误提示清晰，禁用态生效。

---

## 开发注意事项
- 遵循 Vite/TS 路径别名 @/；组件优先使用 Naive UI 自动导入。
- Mock 使用谨慎，避免与真实 Firebase 写入混用；通过 VITE_USE_MOCK 控制。
- Tailwind 类名确保在 tailwind.config.js content 范围内。
- 事务：合理拆分批次，避免一次性过大写入；考虑 Firestore 限制。

---

## 未决问题（需确认）
- 库存计算采用何种精度与单位？是否存在小数库存（当前假设整数）。
- 发货是否支持多次部分发货？（当前假设一次性发货；如需多次发货，需要订单子记录与多次 OUT 记录）
- 入库预告是否支持部分到货？（当前假设一次性到货）
- 是否需要导出 Excel/CSV？不需要
- 是否需要权限控制（谁可发货/到货）与审计日志？不需要

---

## 后续里程碑（如启用部分发货/到货）
- 扩展订单发货子表与 UI
- 入库预告拆分为多个到货批次
- 报表页（按产品、按时间段统计）

# 库存管理功能实现计划（多步骤任务追踪）

最后更新：2025-09-13
适用项目：Vue 3 + Vite 5 + TypeScript + Naive UI + Pinia + Vue Router + TailwindCSS + Vuetify + MockJS + ECharts
数据存储：Firebase（Firestore）

---

## 背景与目标
为现有系统新增“库存管理”模块，按照 repo/vm/view 架构组织：
- repo（数据仓库层）：与 Firebase/Firestore 交互，提供强类型 CRUD 与事务/批处理。
- vm（视图模型层）：Pinia store 或 composable，负责业务规则、状态管理、派生数据与表单校验。
- view（视图层）：Vue SFC 页面与组件，依照现有 UI 风格使用 Naive UI/Vuetify/Tailwind 实现列表、表单与详情。

目标功能：
- 货品：列表 + CRUD（字段：自动生成ID、货物编号、货物名称、备注、当前库存）
- BOM：列表 + CRUD（字段：名称、货物列表[货品*数量*备注]、备注）
- 库存操作记录：列表 + CR（字段：货品、操作类型[入库/出库]、数量、时间、备注）
- 入库预告：列表 + CRUD（字段：预计到货时间、供应商、快递追踪链接、到货状态[到货/未到货]、备注；到货后不可删改）
- 销售订单：列表 + CRUD（字段：名称、客户编号、销售单据编号、货物列表[货品*数量*备注]、备注、发货地址、期望发货时间、实际发货时间、发货状态、发货快递链接[多条逗号分隔]；新建可导入BOM；发货时必须填写链接；发货后不可修改）

---

## 数据模型（建议 Firestore 结构）
注：使用集合/文档，创建时间与更新时间统一由服务器时间戳维护（serverTimestamp）。所有集合默认包含：createdAt、updatedAt、createdBy、updatedBy。

1) products（货品）
- id: string（自动）
- code: string（货物编号，唯一）
- name: string（货物名称）
- remark: string
- stock: number（当前库存，冪等存储，来源于库存操作聚合；允许缓存字段，但真实以操作记录为准）
- isActive: boolean (默认 true)

索引建议：code 唯一；name 前缀查询索引（可选）。

2) boms（BOM）
- id: string
- name: string
- items: Array<{ productId: string; qty: number; remark?: string }>
- remark: string

3) stockRecords（库存操作记录）
- id: string
- productId: string
- type: 'IN' | 'OUT'
- qty: number (>0)
- at: Timestamp
- remark: string
- relatedType?: 'InboundNotice' | 'SalesOrder' | 'Manual'
- relatedId?: string

索引建议：productId+at，type+at。

4) inboundNotices（入库预告）
- id: string
- eta: Timestamp（预计到货时间）
- vendor: string（供应商）
- trackingUrl: string（快递追踪链接）
- status: 'ARRIVED' | 'PENDING'（到货/未到货）
- remark: string
- locked: boolean（到货后 true，用于前端禁用删除/编辑）
- arrivedAt?: Timestamp（到货时间，可选）

规则：当标记 ARRIVED 时写入库存操作记录（IN），并锁定。

5) salesOrders（销售订单）
- id: string
- name: string
- customerCode: string
- billNo: string
- items: Array<{ productId: string; qty: number; remark?: string }>
- remark: string
- shipAddress: string
- expectedShipAt?: Timestamp
- shippedAt?: Timestamp
- shipStatus: 'PENDING' | 'SHIPPED'
- shipTrackingUrls?: string（多个以逗号分隔）
- locked: boolean（发货后 true）

规则：发货时必须填写 shipTrackingUrls，落库库存操作记录（OUT），并锁定。

---

## 业务规则与约束
- 商品库存计算：
  - 可选策略A：实时聚合 stockRecords 计算得到（准确但查询成本高）。
  - 可选策略B：维持 products.stock 缓存字段，同时所有增减通过事务/批处理更新，确保与 stockRecords 一致。推荐采用 B：在 repo 层使用 runTransaction/批处理。若事务失败重试。
- 不可编辑/删除：
  - inboundNotices.status === 'ARRIVED' 后 locked=true，禁止更新/删除。
  - salesOrders.shipStatus === 'SHIPPED' 后 locked=true，禁止更新/删除。
- 发货校验：
  - 从 PENDING -> SHIPPED 的状态变化时，必须提供非空 shipTrackingUrls。
- BOM 导入：
  - 创建销售订单页支持从 BOM 选择后将其 items 复制到订单 items，可再手动调整。

---

## 架构落地（repo / vm / view）

- repo（/src/repo/inventory/*）
  - firebase.ts（公共：初始化，读取配置，导出 db、serverTimestamp、runTransaction）
  - products.repo.ts：CRUD、批量导入、唯一校验（code）、库存调整（内部使用事务更新 stock + 写 stockRecords）
  - boms.repo.ts：CRUD
  - stock-records.repo.ts：Create + 列表查询（按 productId/时间）
  - inbound-notices.repo.ts：CRUD + 到货确认（事务：写 IN 记录、更新产品 stock、锁定预告）
  - sales-orders.repo.ts：CRUD + 发货（事务：校验 tracking、写 OUT 记录、更新产品 stock、锁定订单）

- vm（/src/vm/inventory/*，Pinia store 或 composables）
  - useProductsVM.ts：列表筛选/分页、表单状态、校验、手动入库/出库（新增）
  - useBomsVM.ts
  - useStockRecordsVM.ts（只读 + 过滤）
  - useInboundNoticesVM.ts（到货按钮逻辑）
  - useSalesOrdersVM.ts（发货逻辑 + 追踪链接校验 + BOM 导入）

- view（/src/views/inventory/*）
  - products：list.vue、edit.vue（抽屉/弹窗）
  - boms：list.vue、edit.vue
  - stock-records：list.vue
  - inbound-notices：list.vue、edit.vue（到货后禁用）
  - sales-orders：list.vue、edit.vue（发货后禁用；发货对话框要求追踪链接）
  - 复用 Naive UI DataTable、Form、Modal；遵循项目风格与 Tailwind。

- 路由与导航
  - /inventory 作为父级菜单，子路由包含上述页面；在侧边栏菜单加入入口。

---

## 环境与配置
- .env(.development/.staging/.production) 添加：
  - VITE_USE_MOCK=false（如需关闭 mock）
  - VITE_FIREBASE_API_KEY、VITE_FIREBASE_AUTH_DOMAIN、VITE_FIREBASE_PROJECT_ID 等
- main.ts 中 useMock() 可根据 VITE_USE_MOCK 开关（后续实现）
- 若使用旧有 src/old/utils/firebase.ts，可抽取为 src/utils/firebase.ts 并改为从 env 读取。

---

## 里程碑与任务清单（可勾选）

M5 路由与导航
- [x] /router 下新增 routes（/inventory 及子路由）
- [x] 侧边栏菜单增加“库存管理”分组与子菜单

M1 需求与设计（输出：数据模型与用例确认）
- [ ] 明确字段、校验与边界条件（发货/到货锁定、追踪链接必填）
- [ ] 确认库存策略（事务 + 缓存 stock）与失败重试策略
- [ ] 确认 Firestore 索引需求并在 README 标注需在控制台创建

M2 基础设施
- [x] 新建 src/utils/firebase.ts，从 env 读取配置并导出 db/util
- [x] 新建 /src/repo/inventory/* 仓库模块骨架与类型定义（TypeScript interfaces）
- [x] 编写单元化仓库方法（CRUD、事务封装、错误类型）

M3 视图模型（VM）
- [x] 新建 /src/vm/inventory/* Pinia stores/composables（列表状态、表单状态、过滤、加载态）
- [x] 实现到货确认与发货操作在 VM 层的指令式 API
- [x] BOM 导入至销售订单的合并逻辑与校验

M4 视图（View）
- [x] 新建 /src/views/inventory/ 页面（Products/BOM/StockRecords/Inbound/SalesOrders）
- [x] 表格 + 表单（创建/编辑）- 已在货品页面完成基础 CRUD；其余页面待办
- [x] 产品页：库存字段只读，新增“入库/出库”操作与调整对话框（本次完成）
- [ ] 分页 + 搜索 + 批量操作（可分步）
- [ ] 发货对话框（追踪链接必填，多条用逗号）

M6 Mock 与开发体验（可选）
- [ ] 如需本地无 Firebase，增加 mock/*.ts 模块并由 VITE_USE_MOCK 控制
- [ ] 对列表提供本地分页/筛选模拟

M7 文档与校验
- [ ] README 补充环境变量说明与部署注意事项
- [ ] 针对关键流程编写验证清单（如下）

M8 验收与回归
- [ ] 通过验收标准（如下）
- [ ] npm run tsc 通过
- [ ] npm run build 通过；npm run serve 预览功能正常

---

## 验收标准（Acceptance Criteria）
- 货品：
  - 能创建/编辑/删除/查看，code 唯一校验；列表显示当前库存。
  - 库存不可直接编辑；入库/出库会写入库存记录并原子更新产品库存（本次补充）。
- BOM：
  - 能创建/编辑/删除/查看；items 至少一项且数量>0。
- 库存操作记录：
  - 能按产品与时间筛选查看；新记录写入后产品 stock 增减准确。
- 入库预告：
  - 能创建/编辑/删除；当标记到货时，自动写 IN 记录并锁定不可编辑/删除。
- 销售订单：
  - 能创建/编辑/删除；发货时必须填写追踪链接，自动写 OUT 记录并锁定不可编辑/删除。
- 事务一致性：
  - 并发入库/出库不造成库存错乱；库存与操作记录保持一致。
- UI/UX：
  - 页面风格与既有项目一致；错误提示清晰，禁用态生效。

---

## 开发注意事项
- 遵循 Vite/TS 路径别名 @/；组件优先使用 Naive UI 自动导入。
- Mock 使用谨慎，避免与真实 Firebase 写入混用；通过 VITE_USE_MOCK 控制。
- Tailwind 类名确保在 tailwind.config.js content 范围内。
- 事务：合理拆分批次，避免一次性过大写入；考虑 Firestore 限制。

---

## 未决问题（需确认）
- 库存计算采用何种精度与单位？是否存在小数库存（当前假设整数）。
- 发货是否支持多次部分发货？（当前假设一次性发货；如需多次发货，需要订单子记录与多次 OUT 记录）
- 入库预告是否支持部分到货？（当前假设一次性到货）
- 是否需要导出 Excel/CSV？不需要
- 是否需要权限控制（谁可发货/到货）与审计日志？不需要

---

## 本次变更摘要（2025-09-13）
- 修复：产品保存后列表不刷新问题（在视图层补充显式 reload，VM 已含 load）。
- 变更：产品表单中“库存”改为只读；新增手动“入库/出库”对话框与操作按钮，写入库存记录并原子调整库存。
