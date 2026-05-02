# new_kxt 重构日志

## 2026-05-02

- 建立 Vue 3 + Vite + Element Plus 基础骨架。
- 同步 `public/static/common.js`，接入旧后端地址。
- 迁移普通登录页，保留验证码、分机号、AES 密码加密、token/权限保存。
- 增加旧后端 HTTP 兼容层：`baseApi/readApi/ywBaseApi`、`/api/v1`、SM4 请求/响应兼容。
- 迁移首页第一版：用户信息恢复、一级/二级菜单、页签、外链 iframe、通知入口、安全退出。
- 补充通知公告弹窗：未读列表、分页、批量阅读、详情查看、单条标记已读。
- 继续同步首页账号能力：修改密码、上传头像、头像加载、底部状态栏、分机号心跳、用户在线心跳。

## 可复用经验

- 通用计划文件只记录跨项目方法，项目流水账放单独日志，避免计划变成 token 黑洞。
- 旧项目存在编码问题时，优先新建 UTF-8 文件承接逻辑，少做旧文件整块复制。
- 登录和首页不要一次迁完所有业务副作用，先打通“登录 -> 用户/权限 -> 菜单 -> 页签”的骨架。

## 2026-05-02 补充

- 同步旧首页通知 WebSocket：新增 `/websocket/notice/{account}` 连接、20 秒 ping、最多 5 次重连、断线状态显示。
- 首页接入实时通知刷新：收到徽章消息刷新 `menuBadgeInfo/findMenuBadge`，收到公告消息刷新未读数/列表并弹出右下角提醒。
- 菜单同步旧首页徽章入口：一级菜单聚合展示，二级菜单按 `parent@code` 直接展示。
- 构建验证：`npm run build` 通过，仍保留 Vite 大 chunk 和大字体资源警告。

## 2026-05-02 首页主框架补充

- 同步旧首页菜单打开规则：菜单 URL 支持拆分 query，自动补 `t`、`selectRange`，一级会保留 `fullid`。
- 补充 `openMenuByCode` 能力：可按旧项目菜单 `code` 打开指定二级菜单，通知入口优先打开 `noticemine`，找不到时回退弹窗。
- 补齐页签基础行为：重复打开会复用并更新 query/realPath，支持刷新、关闭当前、关闭其他、关闭右侧。
- 外链 iframe 使用 `realPath`，保留 URL query；内部业务页暂以首页占位承载，等具体页面迁移后再接入真实组件。
- 构建验证：`npm run build` 通过，仍保留 Vite 大 chunk 和大字体资源警告。

## 2026-05-02 CTI 第一阶段

- 创建 `src/stores/cti.js` Pinia 状态库：`ctiState`、`ctiTelNumState`、`ctiCurrentTel`、`ctiCurrentTelGsd`、`ctiCurrentWaitNum/List`、`ctiTopBarStateText/Value` 等字段，`showTel/showZnzs/showSxbdk/showDlsm` 权限计算（复用 `authStore.hasPermission`），`stateColor` 颜色映射，`setCti*` 占位 setter 和 `resetCti`。
- 创建 `CtiTopBar.vue`：顶部电话状态栏，显示当前来电号码、归属地、排队人数、状态倒计时文字、快速拨号按钮（110/119/120/122）。仅当 `showTel && deptId != -1` 时展示。
- 集成到 `Home.vue`：`CtiTopBar` 放在 `submenu-bar` 与 `workspace-bar` 之间，footer 改用 `ctiStore.ctiTelNumState` 替代"未接入 CTI"硬编码。
- 本轮未接真实 CTI WebSocket 和签入签出逻辑，所有 CTI 状态使用 store 默认值，下一轮再接 WebSocket 事件填充。
- 构建验证：`npm run build` 通过。

## 2026-05-02 CTI 第二阶段

- **修复**：`stores/cti.js` 漏了 `import { defineStore } from 'pinia'`，导致 router 启动报 `ReferenceError: defineStore is not defined`。
- 新增 `qrqcActive` 状态字段 + `setQrqcActive` action，对应旧系统签入签出按钮切换。
- 创建 `CtiToolbar.vue`：右侧固定浮动工具栏，UI 对标旧 `tools-bar`。
  - 状态色块（绑定 `ctiStore.stateColor` + `ctiStore.ctiState`），hover 翻面露出位置切换按钮（左/右，持久化到 `localStorage tel-bar-pos`）。
  - 上班打卡/下班打卡按钮（`showSxbdk` 权限控制）。
  - 小休/空闲切换按钮（`showTel && !showDlsm` 控制）。
  - 通话保持/取消保持按钮。
  - 黑名单、呼叫、监控按钮（弹窗/占位）。
  - 智能助手按钮（`showZnzs` 控制）。
  - 图标用纯 CSS SVG mask 代替旧项目 PNG 图片，不依赖后端静态文件。
- 创建 `CtiBlackDialog.vue`：黑名单弹出窗口 UI 骨架（电话号码只读 + 原因输入），按钮点击只做校验提示不调用 API。
- 创建 `CtiCallDialog.vue`：呼叫号码弹出窗口 UI 骨架（号码输入 + 回车确认），按钮点击只做校验提示不调用 API。
- 集成到 `Home.vue`：`CtiToolbar` 放在 `main` 之后 footer 之前，`CtiBlackDialog`/`CtiCallDialog` 放在模板末尾。
- 本轮所有按钮仅做 UI 状态切换占位，不调用真实 `cti_shimang`/`cti_shixian`/`cti_baochi` 等 API，等第三阶段接入 CTI WebSocket 后再打通。
- 构建验证：`npm run build` 通过。

## 2026-05-02 CTI 第三阶段

- 创建 `src/services/ctiSocket.js`：WebSocket 连接管理器，封装建连/断连/心跳/订阅/消息收发。
  - 从 `window.common` 读取 `ctiBaseAPi` + `cti_webSocketBaseApi`，拼接 HTTP/WS 地址。
  - 30 秒心跳定时发送 `SUBSCRIBE` 消息，`disconnect` 时发送 `expires:0` 取消订阅。
  - `isManualClose` 标记区分主动/被动断线。
- 重写 `src/stores/cti.js`，补齐 CTI 核心操作：
  - **登录** `ctiLogin`：`SET_WORKER_ID` → 成功后建 WebSocket → `onopen` 调用 `doCtiSubscribe` 设置初始忙/闲状态。
  - **登出** `ctiLogout`：取消订阅 → 关 WebSocket → `SET_WORKER_ID` 写 `8888` 清空工号。
  - **示忙** `ctiShimang` / **示闲** `ctiShixian`：`SET_EXT_PRESENCE_STATE` → 更新本地状态 + 写操作日志。
  - **保持** `ctiBaochi` / **去保持** `ctiUnbaochi`：`PLAY_VOICE_IN_CALL` / `STOP_VOICE_IN_CALL`。
  - **日志** `ctiLog`：`/cti/log` 写操作日志。`updateUserCtiState`：`/user/updateUserCitState` 同步座席状态。
  - **消息处理** `handleCtiSocketMessage`：`presence` 清空顶部状态提示，`queue` 解析排队人数/明细更新到 `ctiCurrentWaitNum/List`。
  - **工具栏操作** `toggleShimangShixian` / `toggleBaochi`：状态保护（通话中不能示忙示闲、非通话不能保持）+ 调用真实 API。
  - `secondsFormat` 工具函数：秒数 → `MM:SS` 或 `HH:MM:SS`。
- 更新 `CtiToolbar.vue`：示忙示闲按钮改为调用 `ctiStore.toggleShimangShixian()`，保持按钮改为 `ctiStore.toggleBaochi()`，不再做本地假切换。
- 更新 `Home.vue`：
  - `onMounted`：`showTel && deptId != -1 && telNum` 时调用 `ctiLogin`，传入 `dlsm` 标记。
  - `doLogout`：先调 `ctiLogout`（含 WebSocket 断开），再清 storage 和 reset store。
- **未接**：来电弹屏（ringing→addTabs）、事后处理倒计时、小休类型选择、断线重连状态恢复、小爱 STT 语音识别。这些属于第四/五阶段。
- 构建验证：`npm run build` 通过（Home chunk 34.47KB → 42.13KB）。

## 2026-05-02 CTI 第四+第五阶段

- **外呼** `ctiHujiao`：`CLICK_TO_DIAL` → 成功提示 + 回调；486→"对方正在忙碌中"；403→"黑名单号码，禁止拨打"；含 `hi_task/addHiTask` 呼叫记录。
- **挂断** `ctiGuaduan`：`CLICK_TO_HUNGUP`，500→"挂断失败"。
- **黑名单** `ctiHeimingdan`：`BLACK_LIST_ADD/RMV` 和 `VIP_LIST_ADD/RMV` → `bridge/jsoncfg`；成功后 `addBlackList` 写 `playwithtel/option` 后端记录。
- **快捷拨号** `quickDial`：通话中拦截，否则调 `ctiHujiao`。
- **WebSocket 来电/外呼消息处理** `handleCtiSocketMessage`：
  - `incoming + ringing`：清除事后定时器 → 示忙 → 设状态"通话" → 记录来电号码 → 写日志。
  - `incoming/outgoing + talking`：设状态"通话" + 写日志。
  - `incoming/outgoing + hungup`：`handleCallHungup`。
- **事后处理倒计时** `handleCallHungup`：
  - `dlsm` 模式：清定时器 → 示忙。
  - 普通模式：设状态"事后处理" → 按 `common.telKongXianSeconds`（默认60秒）倒计时 → 归零后示闲。
  - 定时器保存在 `postCallTimer`，支持 `clearPostCallTimer` 清理。
- **接入对话框**：
  - `CtiCallDialog` → `ctiStore.ctiHujiao({ tel })` 真实外呼。
  - `CtiBlackDialog` → `ctiStore.ctiHeimingdan({ type: 0, ... })` 真实黑名单。
  - `CtiTopBar` 快捷拨号 → `ctiStore.quickDial(tel)`。
  - 移除 Home.vue 中 CtiTopBar 的 `@quick-dial` 事件桥接，组件直接调 store。
- 新增 state：`ctiCaller` / `ctiCallee` / `ctiCallId` 三项通话身份字段。
- **未接**：来电弹屏自动开事务登记页签（依赖工单模块）、小休类型选择弹窗、断线重连完整状态恢复、三方通话/盲转/内呼/强插等高级呼叫操作、小爱 STT。这些按后续业务需求逐步迁移。
- 构建验证：`npm run build` 通过（Home chunk 42.13KB → 45.98KB）。

## 2026-05-02 CTI 补充：断线重连 + 小休选择

- **断线重连状态恢复** `doCtiSubscribe`：WebSocket `onopen` 时检查 `ctiLastState`，按断线前状态分支恢复。
  - 空闲 → 示闲 + 清定时器 + 写 dxcl 日志。
  - 事后处理 → 若仍有事后定时器则维持示忙，已结束则示闲。
  - 通话 → 维持示忙。
  - 其他（忙碌/小休）→ 维持示忙。
- **小休类型选择弹窗** `CtiRestDialog.vue`：
  - 从 `window.common.rest_type_time` 读取小休选项列表（JSON `{option: [{type, time}]}`）。
  - `restLabel` 格式化"类型-1小时5分钟30秒"展示。
  - 确认后 `startRestTimer(restMinutes, typeTitle)`：示忙→设状态"小休"→倒计时→归零后示闲（通话中跳过）。
  - 定时器独立管理（`restTimer`），`resetCti` 时清理。
- **工具栏操作增强** `toggleShimangShixian`：
  - 空闲 + 有小休配置 → 显示 `CtiRestDialog`（通过 store 的 `showRestDialog` ref 控制）。
  - 空闲 + 无配置 → 直接示忙。
  - 事后处理 → `ElMessageBox.confirm` 二选一：空闲→清定时器并示闲，小休→打开小休选择弹窗。
  - 忙碌/小休 → 清所有定时器并示闲。
- 构建验证：`npm run build` 通过（Home chunk 45.98KB → 49.14KB）。

## 2026-05-02 角色首页/默认工作台

- 梳理旧项目 `rolePageIndex`：旧路由会按 `views/yht/{rolePageIndex}.vue` 动态加载，常见首页包括 `ZxIndex`、`CbgIndex`、`DbzxIndex`、`LdspgIndex`、`FzgIndex`、`ZnjIndex`、`ZnjddzxIndex`、`HfIndex`、`BjshIndex`、`BlankPage`。
- 新增 `src/views/workbench/RoleWorkbench.vue`：先承接各角色首页的核心统计卡片、预警列表、待办预览、通知公告，不一次性搬迁旧 ECharts/地图/快捷菜单等重依赖。
- 新增 `src/views/workbench/workbenchConfig.js`：把不同角色首页的统计接口和预警接口配置化，便于后续逐项补齐。
- 新增 `src/services/workbenchService.js`：封装工作台统计、列表、公告接口。
- `Home.vue` 内部页签开始支持真实组件承载：`rolePageIndex` 指向已登记工作台时显示 `RoleWorkbench`，未迁移业务页仍保留占位提示。
- `router/index.js` 增加 `/BlankPage`、`/ZxIndex`、`/FzgIndex` 等旧默认首页直达路由，兼容旧路径验证。
- 构建验证：`npm run build` 通过，仍保留 Vite 大 chunk 和大字体资源警告。

## 2026-05-02 通知公告/我的公告

- 梳理旧项目通知公告入口：`src/router.js` 中 `notice/mine` 对应 `views/notice/NoticeMine`，`noticemine` 菜单入口会携带 `state=0` 打开未读公告；本轮只迁移阅读侧列表，不迁移 `NoticeManage`、短信发送、模板、发布/编辑流程。
- 新增 `src/services/noticeService.js`，封装 `notice_announcement/mylist`、`notice_announcement/details`、`notice_announcement_o2m_userinfo/batch/read`、`dict/findTreeByDictCode?dictCode=notice`，继续走现有 `http` SM4/AES 兼容层。
- 新增 `src/views/notice/NoticeMine.vue`：支持标题/类型/阅读状态/添加时间查询、分页、标题/类型/发布人/添加时间/到期时间/阅读状态展示、详情弹窗、单条已读和批量已读。
- `Home.vue` 内部页签承载接入真实 `NoticeMine`，`workbenchRegistry` 识别 `/notice/mine`，保留 `noticemine` 首页铃铛入口和未读 `state=0` 参数；公告已读后会刷新首页未读数和菜单徽章。
- `router/index.js` 增加 `/notice/mine` 直达路由，便于独立验证。
- 构建验证：`npm run build` 通过，仍保留 Vite 大 chunk 和大字体资源提示。

## 2026-05-02 首页左侧菜单布局

- 对齐旧首页 `left-submenu` 能力：按 `localStorage.menuShowType === "3"`、`common.showSubmenuLeft`、`common.leftMenuRoleCodes` 三类条件判断是否启用左侧二级菜单。
- `Home.vue` 在左侧菜单模式下隐藏顶部主菜单和横向二级菜单，新增左侧树形菜单和右侧工作区布局，保留菜单图标、徽章、当前菜单选中和点击打开页签逻辑。
- 移动端左侧菜单自动降级为顶部单列区域，避免挤压内容；未启用左侧菜单时仍保持原横向菜单布局。
- 顺带保留空页签兜底 key，避免 `activeTab.id` 为空时报错。
- 右上角 `home-actions` 对齐旧 `user-logo` 视觉：通知铃铛改为白色纯图标+红点，用户入口改为 40px 头像、白色用户名、小下拉箭头的紧凑样式。
- 左侧一级菜单图标对齐旧版：优先使用 `*-blue.png`，图标尺寸恢复为 30px，避免普通顶部菜单图标样式误用到侧边栏。
- 修复菜单图标 glob 路径：`import.meta.glob("@/assets/...")` 未展开导致 `menuIconModules` 为空，改为 `../../assets/images/menus/*.png` 相对路径。
- 左侧菜单字体加粗，一级标题和二级菜单项统一使用 700 字重，贴近旧首页菜单视觉。
- 构建验证：`npm run build` 通过，仍保留 Vite 大 chunk 和大字体资源提示。

## 2026-05-02 首页头部视觉优化

- 提交上一轮基线：`695b910 feat: align home navigation layout`，再开始头部样式调整。
- 使用 `frontend-design` 思路将头部收敛为紧凑政务工作台风格：顶部主导航降高、品牌改为单行、主菜单增加稳定分隔线和底部激活线。
- 二级菜单栏高度对齐旧首页，激活线改为绝对定位，避免旧实现中伪元素参与布局造成文字和下划线错位。
- 当前位置栏和页签栏高度收敛，减少头部纵向占用，让首屏更接近旧首页的信息密度。
- 构建验证：`npm run build` 通过，仍保留 Vite 大 chunk 和大字体资源提示。

## 2026-05-02 坐席首页 (ZxIndex) 迁移

- 旧项目 `views/yht/ZxIndex.vue` → 新项目 `src/views/workbench/ZxIndex.vue`，使用 Vue 3 `<script setup>` + Element Plus。
- 完整迁移以下区块：
  - **5 个统计卡片**（暂存/退回/特别关注/今日已完成/预超期），使用渐变色卡片，点击跳转对应列表。
  - **交互数据**（来源卡片横向滚动）：话务/非话务来源的待处理/已处理统计，支持左右箭头滚动，按角色过滤。
  - **我的事务表格**（暂存事务/退回事务分页签），带序号/编号/标题/登记时间/办理单位/状态/操作列（立即处理、打印、录音标记）。
  - **快捷功能**（可配 5 个）：菜单树选择 + 多选保存 + 单条删除，对接 `/sys/mymenu/*` 接口。
  - **新知识点**（3 条列表 + 详情弹窗 + 收藏/取消收藏），对接 `/klStudy/findPgae`、`/klCollect/*`、`/knowledgeBase/zsk_knowledge_one`。
  - **通知公告 & 用户手册**（各 5 条 + 详情弹窗），对接 `notice_announcement/mylist`，区分通知公告和用户手册。
- `Home.vue` 新增 `provide('workbenchNav', { openMenuByCode, openCustomTab })`，子组件通过 `inject` 调用导航方法。
- `workbenchService.js` 新增 9 个坐席专用接口函数（交互数据、知识库 CRUD、快捷菜单 CRUD、工单详情）。
- `workbenchRegistry.js` 新增 `migratedPages` 集合，已迁移页面直接映射真实组件，未迁移页面继续使用 `RoleWorkbench` 承接。
- UI 保持蓝色政务工作台风格，统计卡片用渐变色，响应式适配 1280px 以下。
- **暂未迁移**：打印预览组件（依赖旧 `PrintExport` 组件）、语音播放交互。

## 2026-05-02 角色首页全量迁移（第 2 轮：全部剩余 7 页）

- 安装 `echarts` 依赖（^5.x），新增 `src/utils/echarts.js` 共享图表工厂（仪表盘/环形饼图/折线图/柱线混合）。
- **CbgIndex（催办工作台）**：5 个统计卡片 + 数据汇总(本月) + 电话催办单表格 + 新知识点 + 通知公告/用户手册 + 快捷功能。
- **DbzxIndex（督办中心）**：5 个统计卡片 + 数据汇总（督办类型动态列表） + 挂号督办单表格 + 新知识点 + 通知公告/用户手册 + 快捷功能。
- **LdspgIndex（领导派工）**：4 个统计卡片 + 数据汇总（延期/分派/疑难批示）+ 待审核单表格 + 新知识点 + 通知公告/用户手册。
- **FzgIndex（分转岗）**：4 个统计卡片 + 预警类信息 + 事务去向占比环形饼图 + 分派准确率折线图 + 3 个仪表盘（按时分派率/分派准确率/退单率）+ 通知公告。
- **ZnjIndex（职能局）**：6 个统计卡片 + 预警类信息 + 热点问题 TOP10 环形饼图 + 热点趋势折线图 + 3 个仪表盘（及时上报率/重办率/逾期率）+ 通知公告。
- **ZnjddzxIndex（职能局调度）**：6 个统计卡片 + 预警类信息 + 4 个仪表盘 2x2 布局 + 直属下级数据表格（可点击钻取）。
- **HfIndex（回访）**：今日回访进度条 + 待回访卡片 + 预警类信息 + 回访结果环形饼图 + 回访按时率折线图（个人/整体对比）+ 2 个仪表盘 + 通知公告。
- **BjshIndex（办结审核）**：结构与 HfIndex 相同，标题改为审核版本，图表 DOM ID 加 `bjsh_` 前缀防止冲突。
- `workbenchRegistry.js`：全部 9 个角色首页均已映射真实组件，移除 `RoleWorkbench` 兜底逻辑。
- `workbenchService.js`：Group A 页面复用已有通用接口（`getWorkbenchCount`/`getWorkbenchList`/`getWorkbenchNotices` + 知识库/快捷菜单接口），未新增专用函数。
- `Home.vue` 首轮添加的 `provide('workbenchNav')` 已被所有新页面用于菜单打开和自定义页签导航。
- **暂未迁移**：ECharts 窗口 resize 事件已在各页面注册/注销；图表数据为空时自动显示空图表容器；打印组件、语音播放、录音标记功能按后续需求补充。
- 构建验证：`npm run build` 通过，Home chunk 增至 ~1.35 MB（含所有页面+echarts），后续可通过动态 import 拆分。
