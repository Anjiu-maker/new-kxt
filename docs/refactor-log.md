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
