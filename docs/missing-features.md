# 暂未迁移功能清单

> 最后更新: 工单模块迁移完成后

---

## AddOrder 暂未迁移功能

旧 `AddOrder.vue` 8038 行 → 新版本已覆盖核心功能，以下 4 项因依赖外部 SDK/服务暂不迁移：

### 1. 高德地图 (AMap)

**旧代码：** `loadAMapScript()` + `<div id="allmap">` 地图标记
**用途：** 事发地址在地图上标记、点击取坐标、逆地理编码
**阻塞项：** 需加载 AMap JS SDK (`@/utils/AMap`)，旧项目代码已从百度地图迁移为高德

### 2. 小爱机器人 (iBot)

**旧代码：** `awakeIbot()` → `extractInfo` 事件 → `autoFill()` / `fillEach()`
**用途：** 机器人对话结束后自动填充表单（摘要/标题/类型/热点/地址/内容）
**阻塞项：** 需要机器人服务 WebSocket 连接和 `$store.state.dialogueSummaryText` 等 Vuex 状态

### 3. 语音识别 (STT)

**旧代码：** `changeClass1()` / `changeClass2()` 按钮切换，调用语音识别接口
**用途：** 坐席口述转文字填入内容区
**阻塞项：** 语音识别 API 接口未确认，旧代码中标记为 "TODO"

### 4. 视频播放器 (vue-video-player)

**旧代码：** `<video-player>` 组件 + `vue-video-player` / `video.js`
**用途：** 附件中的视频文件播放
**阻塞项：** `vue-video-player` 包无 Vue 3 版本，需替换为 `video.js` 原生或 `@element-plus` 方案

---

## 已完成的工单模块

| 类别 | 完成数 | 说明 |
|------|--------|------|
| 列表页 | 6/6 | Fzgth, Cfdb, Zcsw, ZcswAll, ZcswSpecial, Rwfpmx |
| 表单页 | 3/3 | AddOrder, AddOrder-quick, AddOrder-special (AddOrderSso 跳过) |
| 流转页 | 1/1 | FlowCommonList (30+ 流程映射) |
| 表单组件 | 28/28 | 全部 form/*.vue |
| 共享组件 | 7/7 | Container, Panel, Audio, OrderQuery, Orderinfo, PrintExport, SelectDeptOrUser |
| 基础设施 | 4/4 | orderService, useGlobal, flowApiMapping, integratedQuery |

---

## 已完成的首批缺失功能

### 1. 打印预览组件 (PrintExport) ✅ 已完成

**旧项目位置：** `src/components/PrintExport.vue`

## 1. 打印预览组件 (PrintExport) ✅ 已完成

**旧项目位置：** `src/components/PrintExport.vue`
**新项目位置：** `src/components/PrintExport.vue`

**完成内容：**
- 创建 Vue 3 + Element Plus 版 PrintExport 组件
- 支持 print / zprint / dbprint 三种打印模式
- 支持 `window.print()` 浏览器打印 + CSS `@media print`
- 支持 Word 导出（`/wordPrint/downWord` 接口）
- 已集成到 ZxIndex / CbgIndex / DbzxIndex / LdspgIndex 四个页面

---

## 2. 录音播放/语音标记 ✅ 已完成

**完成内容：**
- 各页面表格操作列的麦克风图标新增点击播放功能
- 使用 HTML5 `<audio>` 播放后端录音文件
- 已集成到 ZxIndex / CbgIndex / DbzxIndex / LdspgIndex 四个页面

---

## 3. 业务 Form 弹窗组件 ✅ 已完成

**新项目位置：** `src/views/workbench/SqdbForm.vue` / `EcdbForm.vue` / `DgdForm.vue`

**完成内容：**
- SqdbForm（申请督办）：CbgIndex 集成，支持查看工单摘要 + 填写督办原因
- EcdbForm（二次督办）：DbzxIndex 集成，支持查看工单摘要 + 填写督办意见
- DgdForm（待归档处理）：LdspgIndex 集成，支持归档/待跟进/重办/重新回访多模式

**注意：** 简化版表单不依赖旧 Orderinfo 组件，通过 `getOrderDetail` API 获取工单摘要。旧版完整表单（含流程详情、特别关注、部门选择器等）待 Orderinfo 组件迁移后再补全。

---

## 4. flowApiMapping 动态接口映射 ✅ 已完成

**新项目位置：** `src/utils/flowApiMapping.js`

**完成内容：**
- 从旧项目同步完整 `listApi` 映射表（100+ 条目）
- FzgIndex / ZnjIndex / HfIndex / BjshIndex 的 `loadWarning` 调用改为使用 `flowApiMapping.listApi[code].api`
- 后端修改 flowApiMapping 配置时，只需更新映射文件即可同步

---

## 5. FzgIndex 菜单徽章数据 (badgeJson) ✅ 已完成

**现状：** FzgIndex 通过独立接口（`orderInfo/dfp_order_list`、`orderInfo/dgj_order_list`）获取数量，功能等价于旧版从 `$parent.badgeJson` 读取。无需额外修改。

---

## 6. 权限判断 (hasPermission) ✅ 已完成

**完成内容：**
- CbgIndex / DbzxIndex / LdspgIndex 的打印功能中已集成 `authStore.hasPermission('lookOrderInfo', 1)` 权限判断
- 接口调用传入 `isHaveLookBaomi` 参数控制是否返回保密字段

---

## 7. ZnjddzxIndex 实时刷新机制 ✅ 已完成

**完成内容：**
- 新增 `refreshData()` 函数定时刷新卡片指标和预警数据
- 刷新间隔从 `window.common.refreshTime` 读取（默认 30 秒）
- `setInterval` 在 `onMounted` 启动，`onUnmounted` 清除
- 支持 `localStorage.isDjsRefresh` 标记的乐观计数递增（新工单到达时 +1）

---

## 汇总表

| 缺失功能 | 状态 | 说明 |
|----------|------|------|
| 打印预览 (PrintExport) | ✅ 已完成 | 新组件 + 4 页面集成 |
| 录音播放 | ✅ 已完成 | HTML5 Audio 播放 + 4 页面集成 |
| Form 弹窗 | ✅ 已完成 | 简化版表单 + 3 页面集成 |
| flowApiMapping 动态接口 | ✅ 已完成 | 完整映射表 + 4 页面动态调用 |
| badgeJson 徽章 | ✅ 已完成 | 独立接口等价替代 |
| hasPermission 权限判断 | ✅ 已完成 | 集成到打印功能 |
| ZnjddzxIndex 实时刷新 | ✅ 已完成 | 30s 轮询 + localStorage 乐观更新 |
