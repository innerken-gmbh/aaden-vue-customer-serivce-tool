# 库存管理（简版）

最后更新：2025-09-13
适用：Vue 3 + Vite 5 + TS + Naive UI + Pinia + Vue Router + Tailwind + Vuetify + MockJS + ECharts
数据：Firebase Firestore

---

## 一、项目相关需求（What & Rules）

- 技术与运行
  - Node 18+；包管理：npm（含 package-lock.json）。
  - Vite 别名：@ → src；Tailwind 已配置；Naive UI 通过 unplugin 自动引入；mdi 图标。

- 架构与目录
  - 分层：repo（数据）/ vm（视图模型）/ view（视图）。
  - 路由：/inventory（父级）下含 products、bom、stock-records、inbound、sales-orders。

- 数据模型（Firestore 集合，均含 createdAt/updatedAt/...）
  1) products：{ id, code(唯一), name, remark, stock(缓存), isActive }
  2) boms：{ id, name, items[{ productId, qty>0, remark? }], remark }
  3) stockRecords：{ id, productId, type:IN|OUT, qty>0, at, remark, relatedType?, relatedId? }
  4) inboundNotices：{ id, eta, vendor, trackingUrl, status:PENDING|ARRIVED, remark, locked, arrivedAt? }
  5) salesOrders：{ id, name, customerCode, billNo, items[], remark, shipAddress, expectedShipAt?, shippedAt?, shipStatus:PENDING|SHIPPED, shipTrackingUrls?, locked }

- 关键业务规则
  - 库存策略：采用“缓存字段 stock + 操作记录”的一致性方案（推荐 B）。所有增减在 repo 层用事务/批处理：写 stockRecords 并同步更新 products.stock；失败重试。
  - 锁定：入库预告 ARRIVED → locked=true 禁止改删；销售订单 SHIPPED → locked=true 禁止改删。
  - 发货校验：PENDING → SHIPPED 时必须提供非空 shipTrackingUrls（逗号分隔，http/https）。
  - BOM 导入：销售订单可选择 BOM，将其 items 合并至订单 items，可人工调整。

- 视图规范
  - 工具条（搜索/批量/新增）+ 列表（n-data-table）+ 分页（n-pagination）。
  - 状态处理：loading/empty/error；禁用进行中操作；Naive UI 表单校验与 feedback。
  - 详情/编辑：Drawer 或 Modal；样式与产品页一致；可访问性（回车提交/Esc 关闭）。

- 环境变量（.env.*）
  - VITE_USE_MOCK=false（可按需关闭 mock）
  - Firebase：VITE_FIREBASE_API_KEY、VITE_FIREBASE_AUTH_DOMAIN、VITE_FIREBASE_PROJECT_ID 等

- 索引/约束（需在控制台配置）
  - products.code 唯一；stockRecords：productId+at、type+at 复合索引（视查询需要）。

- 验收标准（摘要）
  - 货品：CRUD，code 唯一校验；库存只读，通过记录原子增减。
  - BOM：CRUD，items 至少 1 条且 qty>0。
  - 库存记录：按产品与时间可筛选；写入后库存变更准确。
  - 入库预告：可 CRUD；到货会写 IN 记录并锁定。
  - 销售订单：可 CRUD；发货需追踪链接，写 OUT 记录并锁定。
  - 事务一致：并发入出库不导致库存错乱；UI 交互一致、提示清晰。

---

## 二、需要执行的任务（Tasks）

- M1 需求与设计
  - [ ] 明确字段校验与边界（发货/到货锁定、追踪链接必填）
  - [ ] 确认库存策略（事务 + 缓存 stock）与失败重试策略
  - [ ] 在 README 标注所需 Firestore 索引

- M2 基础设施
  - [x] 新建 src/utils/firebase.ts（从 env 读取并导出 db/util）
  - [x] 新建 /src/repo/inventory/* 骨架与类型
  - [x] 仓库方法：CRUD、事务封装、错误类型

- M3 视图模型（VM）
  - [x] 新建 /src/vm/inventory/*（列表/表单状态、过滤、加载态）
  - [x] 到货确认与发货指令式 API
  - [x] BOM 导入与合并校验

- M4 视图（View）
  - [x] 新建 /src/views/inventory/ 页面入口（Products/BOM/StockRecords/Inbound/SalesOrders）
  - [x] 表格 + 表单（创建/编辑）基础 —— 已在产品页完成，其他页待办
  - [ ] 分页 + 搜索 + 批量操作（所有子页按规范补齐）
  - [ ] 发货对话框（追踪链接必填，逗号分隔，多条）
  - 产品页补充（已纳入规范）：
    - [x] 库存字段只读
    - [x] “入库/出库”对话框与操作按钮：写库存记录并原子调整库存

  - 视图层检查清单（精简版）
    - 通用：
      - [ ] 布局：工具条 + 列表 + 分页；loading/empty/error；禁用进行中操作
      - [ ] 搜索：300ms 防抖或按钮触发；“清空”重置并返回第 1 页
      - [ ] 批量：多选 row-key=id；仅对可操作项启用
      - [ ] 详情/编辑：Drawer/Modal；样式一致；可访问性
    - Products：
      - [ ] 列：code/name/stock/remark/updatedAt/操作；搜索（code/name 模糊、stock 范围）；默认 updatedAt desc
      - [ ] 批量删除（按 vm/repo 校验）
      - [ ] validateCodeUnique 到 n-form-item
      - [ ] “查看库存记录”快捷入口
    - BOM：
      - [ ] 列与搜索；批量删除；表单 items 至少 1 条（qty>0），重复合并/报错
    - Stock Records：
      - [ ] 列：product/type/qty/relatedId/createdAt/remark；筛选：product、type、时间范围；时间倒序
    - Inbound：
      - [ ] 列与筛选；批量删除（仅未到货）；批量“标记到货”二次确认 -> vm
      - [ ] 已到货锁定不可编删
    - Sales Orders：
      - [ ] 列与筛选；批量删除（仅未发货）
      - [ ] 表单：orderNo/customerCode 必填；BOM 导入合并
      - [ ] 发货对话框：trackingLinks 必填（http/https，逗号分隔），shipAt 默认当前；提交 vm.ship 成功后刷新并锁定

- M5 路由与导航
  - [x] /router 下新增 /inventory 及子路由
  - [x] 侧边栏菜单新增“库存管理”分组与子菜单

- M6 Mock（可选）
  - [ ] 若本地无 Firebase，提供 mock/*.ts，并由 VITE_USE_MOCK 控制
  - [ ] 列表本地分页/筛选模拟

- M7 文档与校验
  - [ ] README 增补环境变量与部署注意
  - [ ] 编写验证清单（关键流程）

- M8 验收与回归
  - [ ] 按验收标准通过
  - [ ] npm run tsc 通过
  - [ ] npm run build 通过；npm run serve 预览正常
