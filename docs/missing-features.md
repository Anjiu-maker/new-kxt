# 角色首页迁移 — 暂未迁移功能清单

## 1. 打印预览组件 (PrintExport)

**旧项目位置：** `src/components/PrintExport.vue`
**涉及首页文件：**

| 旧文件 | 新文件 | 功能说明 |
|--------|--------|----------|
| `views/yht/ZxIndex.vue` | `views/workbench/ZxIndex.vue` | 我的事务表格中"打印/导出"按钮 |
| `views/yht/CbgIndex.vue` | `views/workbench/CbgIndex.vue` | 电话催办单表格中"打印/导出"按钮 |
| `views/yht/DbzxIndex.vue` | `views/workbench/DbzxIndex.vue` | 挂号督办单表格中"打印/导出"按钮 |
| `views/yht/LdspgIndex.vue` | `views/workbench/LdspgIndex.vue` | 待审核单表格中"打印/导出"按钮 |

**旧实现：**
- 组件接收 `isshowPrint` 控制弹窗显隐，接收 `printData` 工单详情数据
- 依赖 `v-print` 指令（调用浏览器打印）、`v-dialogDrag` 指令（弹窗拖拽）
- 工单详情接口：`orderInfo/find?orderNo=X&isHaveLookBaomi=X`
- 支持两种模式：`print`（常规打印）、`zprint`（可能是专项打印）

**当前降级状态：**
- ZxIndex 模板中保留了打印/录音图标按钮，但点击只弹 `ElMessage.info` 提示
- CbgIndex/DbzxIndex/LdspgIndex 模板中直接移除了打印按钮
- `getOrderDetail()` 接口已在 `workbenchService.js` 中封装，但未接入 UI

**迁移前置条件：**
- 安装或实现 `v-print` 等效功能（可用 `window.print()` + CSS `@media print`）
- 迁移或移除弹窗拖拽指令 `v-dialogDrag`
- 实现 `hasPermission('lookOrderInfo', 1)` 权限判断（authStore 已支持）

---

## 2. 录音播放/语音标记

**涉及首页文件：**

| 旧文件 | 新文件 | 功能说明 |
|--------|--------|----------|
| `views/yht/ZxIndex.vue` | `views/workbench/ZxIndex.vue` | 我的事务表格操作列麦克风图标 |
| `views/yht/CbgIndex.vue` | `views/workbench/CbgIndex.vue` | 电话催办单表格操作列麦克风图标 |
| `views/yht/DbzxIndex.vue` | `views/workbench/DbzxIndex.vue` | 挂号督办单表格操作列麦克风图标 |
| `views/yht/LdspgIndex.vue` | `views/workbench/LdspgIndex.vue` | 待审核单表格操作列麦克风图标 |

**旧实现：**
- 表格列中根据 `row.haveSoundName !== '无'` 条件显示麦克风图标
- 点击后应播放对应录音文件（旧代码中图标无点击事件，可能在其他地方绑定或仅做标记展示）

**当前降级状态：**
- ZxIndex 中保留了麦克风图标的条件渲染（`v-if="row.haveSoundName !== '无'"`），但无点击交互
- CbgIndex/DbzxIndex/LdspgIndex 模板中未包含此功能

**迁移前置条件：**
- 确认录音文件存储位置和播放方式（后端接口 or 静态文件 URL）
- 实现音频播放（可用 HTML5 `<audio>` 或 Element Plus 组件）

---

## 3. 业务 Form 弹窗组件

**旧组件来源：** `src/views/order/form/`（导出 `SqdbForm`、`EcdbForm`、`DgdForm`）

| 旧文件 | 使用的 Form | 触发场景 | 功能说明 |
|--------|-------------|----------|----------|
| `views/yht/CbgIndex.vue` | `SqdbForm` | 催办岗首页"申请督办"操作 | 申请督办表单弹窗，props: `page='indexDbsqFrom'`, `isShowForm.sync` |
| `views/yht/DbzxIndex.vue` | `EcdbForm` | 督办中心首页"二次督办"操作 | 二次督办表单弹窗 |
| `views/yht/LdspgIndex.vue` | `DgdForm` | 领导派工首页"待归档"处理 | 待归档处理表单弹窗，props: `isShowForm.sync`, `isIndex=true` |

**当前降级状态：**
- 各新页面的表格操作按钮"立即处理/二次督办"调用 `openCustomTab` 打开 `/order/addOrder` 页签
- 这是一种**临时降级方案**：用独立页签代替嵌入弹窗，等 `/order/addOrder` 页迁移后再回补弹窗形态

**迁移前置条件：**
- 迁移 `src/views/order/form/` 下的 `SqdbForm`、`EcdbForm`、`DgdForm` 组件到 Vue 3
- 或等 `/order/addOrder` 页迁完后评估是否仍需弹窗快捷入口

---

## 4. flowApiMapping 动态接口映射

**旧项目位置：** `src/utils/flowApiMapping.js`

**涉及首页文件：**

| 旧文件 | 新文件 | 用途 |
|--------|--------|------|
| `views/yht/FzgIndex.vue` | `views/workbench/FzgIndex.vue` | `getTotalNumber(code)` 通过 `flowApiMapping.listApi[code].api` 获取预警指标接口 |
| `views/yht/ZnjIndex.vue` | `views/workbench/ZnjIndex.vue` | 同上 |
| `views/yht/HfIndex.vue` | `views/workbench/HfIndex.vue` | 同上 |
| `views/yht/BjshIndex.vue` | `views/workbench/BjshIndex.vue` | 同上 |

**旧实现：**
- `flowApiMapping.listApi` 是一个 code → `{ api, ... }` 的映射表
- `getTotalNumber(code)` 通过 `flowApiMapping.listApi[code].api` 查找接口路径
- 这允许后端菜单配置中的 code 动态决定统计接口

**当前降级状态：**
- 新页面中预警类指标的接口路径**直接硬编码**在各页面组件的 `loadWarning()` 调用中
- 这意味着如果后端修改了 flowApiMapping 配置，前端硬编码不会同步更新

**迁移建议：**
- 方案 A：在新项目中创建 `flowApiMapping.js`，从旧项目同步映射表，页面改为动态调用
- 方案 B：保持硬编码，如果后端接口路径稳定且不会变更，则硬编码更简单直观

---

## 5. FzgIndex 菜单徽章数据 (badgeJson)

**涉及文件：** `views/yht/FzgIndex.vue` → `views/workbench/FzgIndex.vue`

**旧实现：**
- FzgIndex 有 3 个 computed 属性从 `this.$parent.badgeJson` 读取实时徽章数据：
  - `dfp` — `badgeJson['res1140@res1132']`（待分派数量）
  - `thgd` — `badgeJson['res1144@res1132']`（退回工单数量）
  - `dgj` — `badgeJson['res1165@res1132']`（待跟进数量）
- 这些值对应菜单徽章系统，Home.vue 会定期刷新徽章数据

**当前降级状态：**
- 新 FzgIndex.vue 直接通过接口 `orderInfo/dfp_order_list`、`orderInfo/dgj_order_list` 获取数量
- 不再依赖父组件 `badgeJson`，使用独立接口调用
- 功能等价但调用方式不同（旧项目可能是批量获取徽章，新项目是逐个接口调用）

---

## 6. 权限判断 (hasPermission)

**涉及首页文件：**

| 旧文件 | 新文件 | 用途 |
|--------|--------|------|
| `views/yht/CbgIndex.vue` | `views/workbench/CbgIndex.vue` | `printD()` 中检查 `lookOrderInfo` 权限决定是否查保密字段 |
| `views/yht/DbzxIndex.vue` | `views/workbench/DbzxIndex.vue` | 同上 |

**旧实现：**
```js
this.isHaveLookBaomi = this.hasPermission(this.authCode.optCode.lookOrderInfo, 1)
```
- `type=1` 表示从 `options[0].submenu` 中查找权限项
- 接口调用：`orderInfo/find?orderNo=X&isHaveLookBaomi=boolean`

**当前降级状态：**
- authStore 中已有 `hasPermission(code, type)` 方法，可直接使用
- 但由于打印组件未迁移，此权限判断暂时不会被触发

---

## 7. ZnjddzxIndex 实时刷新机制

**涉及文件：** `views/yht/ZnjddzxIndex.vue` → `views/workbench/ZnjddzxIndex.vue`

**旧实现：**
- `props: { refreshTime: { type: Number } }` — 父组件传入刷新间隔
- `watch: { refreshTime(newVal) { ... } }` — 定时器触发重新加载数据
- `watch: { '$store.state.isDjsRefresh'(val) { this.$store.state.isDjsRefresh = false; ... } }` — 收到新工单通知时自动刷新待接收数
- `beforeRouteEnter` / `beforeRouteLeave` — 进入/离开页面时通知父组件开启/关闭刷新定时器

**当前降级状态：**
- 新 ZnjddzxIndex.vue 只在 `onMounted` 时加载一次数据
- 无定时刷新、无 store 监听、无路由守卫
- 用户需手动刷新浏览器或切换页签来获取最新数据

**迁移前置条件：**
- 在 Home.vue 或 workbenchNav 中提供定时刷新机制
- 监听 store/WebSocket 中的新工单事件触发增量刷新

---

## 汇总表

| 缺失功能 | 影响页面数 | 严重程度 | 是否影响核心数据展示 |
|----------|-----------|----------|---------------------|
| 打印预览 (PrintExport) | 4 | 中 | 否（仅操作功能） |
| 录音播放 | 4 | 低 | 否（仅辅助标记） |
| Form 弹窗 (SqdbForm/EcdbForm/DgdForm) | 3 | 中 | 否（降级为页签跳转） |
| flowApiMapping 动态接口 | 4 | 低 | 否（硬编码等价） |
| badgeJson 徽章数据 | 1 | 低 | 否（独立接口替代） |
| hasPermission 权限判断 | 2 | 低 | 否（打印未迁移） |
| ZnjddzxIndex 实时刷新 | 1 | 高 | 是（数据不会自动更新） |
