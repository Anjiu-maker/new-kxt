# new_kxt 项目说明

`new_kxt` 是对旧项目 `kxt-one-number-web-quick` 的 Vue 3 重构版本。旧项目是新乡一号响应平台前端，核心模块包括工单登记与流转、电话平台 CTI、知识库、通知公告、综合查询、考勤、系统设置、统计报表等。

本项目当前目标不是一次性重写所有业务，而是先建立可运行、可登录、可承接旧流程的新框架，再按模块逐步迁移旧页面。

## 技术栈

- Vue 3 + Vite
- Vue Router 4
- Pinia
- Element Plus
- Axios
- crypto-js：兼容旧登录 AES 加密
- sm4js：兼容旧后端 SM4 请求/响应处理

常用命令：

```bash
npm install
npm run dev
npm run build
npm run preview
```

## 旧项目核心结构

旧项目路径：

`E:\jxt\新乡\kxt-one-number-web-quick`

关键目录：

- `src/views/Home.vue`：旧首页主框架，包含顶部菜单、二级菜单、左侧菜单、页签、通知、用户操作、CTI 工具栏等大量逻辑。
- `src/views/Login.vue`：普通登录页，包含验证码、分机号、AES 密码加密、重复登录确认等流程。
- `src/views/yht`：不同角色首页，如 `ZxIndex`、`FzgIndex`、`ZnjIndex`、`HfIndex` 等。
- `src/views/notice`：通知公告相关页面，尤其是我的公告阅读列表。
- `src/assets/images/menus`：旧首页菜单图标，包含普通图标和 `*-blue.png` 激活/侧栏图标。
- `public/static/common.js`：运行时后端地址、CTI 地址、白名单、业务配置等。

## 新项目当前结构

主要目录：

- `src/services`：接口服务层和兼容层。
- `src/stores`：Pinia 状态，包括认证状态和 CTI 状态。
- `src/views/login`：新登录页。
- `src/views/home`：新首页主框架、CTI 顶栏/工具栏/弹窗。
- `src/views/notice`：通知公告阅读页。
- `src/views/workbench`：角色首页承接和后续迁移入口。
- `src/styles`：全局样式、主题变量和公共 CSS。
- `public/static/common.js`：同步旧后端运行时配置。
- `docs/refactor-log.md`：当前项目迁移日志。
- `plan.md`：跨项目可复用的重构方法，不写具体流水账。

## 已迁移能力

### 登录

已迁移普通登录页：

- 账号、密码、验证码、分机号。
- `/cti/getTelNum` 初始化分机号。
- `/sendImgCode` 获取图形验证码。
- `/login` 预校验和重复登录确认。
- AES 密码加密。
- 登录成功后保存旧项目关键状态：`accessToken`、`rolePageIndex`、`account`、`telNum`、`roleCode`、`userId`、`menuShowType` 等。
- 登录后暂由新首页承接，不直接跳旧业务首页。

### 首页主框架

已迁移新版 `src/views/home/Home.vue`：

- 顶部一级菜单。
- 横向二级菜单。
- `menuShowType === "3"`、`showSubmenuLeft`、`leftMenuRoleCodes` 对应的左侧菜单模式。
- 菜单图标资源兼容，使用 `src/assets/images/menus/*.png`。
- 当前位置。
- 页签打开、刷新、关闭、关闭其他、关闭右侧。
- 外链 iframe 承载。
- 内部页面注册承载。
- 用户头像、修改密码、上传头像、安全退出。

### 通知公告

已迁移：

- 首页未读公告数。
- 通知弹窗。
- 我的公告列表 `NoticeMine.vue`。
- 公告详情。
- 单条已读、批量已读。
- WebSocket 实时刷新通知和菜单徽章。

### CTI

已迁移第一批 CTI 能力：

- `src/stores/cti.js`：CTI 状态、权限判断、按钮状态、倒计时。
- `src/services/ctiSocket.js`：CTI WebSocket 连接、订阅、心跳、断线处理。
- `CtiTopBar.vue`：顶部话务状态栏。
- `CtiToolbar.vue`：右侧话务工具栏。
- `CtiBlackDialog.vue`、`CtiCallDialog.vue`、`CtiRestDialog.vue`：黑名单、呼叫、小休选择弹窗。
- 签入/签出、示忙/示闲、保持/取消保持、外呼、挂断、黑名单等基础流程已接入一部分真实接口。

仍需继续补齐的 CTI 能力：

- 来电自动打开事务登记页签。
- 更完整的事后处理业务流程。
- 三方通话、盲转、内呼、强插等高级呼叫能力。
- 小爱 STT 等扩展能力。

### 角色首页承接

当前已有统一承接：

- `src/views/workbench/RoleWorkbench.vue`
- `src/views/workbench/workbenchRegistry.js`
- `src/views/workbench/workbenchConfig.js`
- `src/services/workbenchService.js`

这些文件只是先让旧 `rolePageIndex` 能进入新项目并展示基础工作台，不代表 `src/views/yht` 下的旧角色首页已经完整迁移。

## 尚未完整迁移

重点未迁移目录：

`E:\jxt\新乡\kxt-one-number-web-quick\src\views\yht`

常见角色首页包括：

- `ZxIndex.vue`
- `FzgIndex.vue`
- `ZnjIndex.vue`
- `ZnjddzxIndex.vue`
- `HfIndex.vue`
- `CbgIndex.vue`
- `DbzxIndex.vue`
- `LdspgIndex.vue`
- `BjshIndex.vue`
- `BlankPage.vue`

下一步建议按当前登录账号的 `localStorage.rolePageIndex` 优先迁移对应首页。每轮只迁一个角色首页，先保功能，再整理样式和抽象。

## 迁移原则

- 先保证登录、菜单、页签、权限、构建不坏。
- 页面接口统一放入 `src/services`，不要在组件里散落裸接口。
- 继续使用现有 `http` 实例，避免新建 axios 实例。
- 新代码使用 Vue 3 `<script setup>` 和 Element Plus。
- 新文件保持 UTF-8 中文，不直接复制旧项目乱码。
- 对旧页面先梳理接口、区块、图表、表格、跳转和权限，再动手迁移。
- 旧代码中已有注释的业务逻辑，新代码对应实现必须保留等价注释。
- 旧注释如果存在乱码或表达不清，迁移时改写为 UTF-8 清晰中文，不逐字复制乱码。
- 注释只解释业务意图、兼容原因和风险边界，不解释显而易见的语法。
- 高风险逻辑必须补注释：登录鉴权、加解密、菜单/页签、通知 WebSocket、CTI 状态流转、角色首页接口统计。
- 每轮迁移完成前，检查旧文件注释是否已在新文件中体现。
- 每轮迁移后必须执行 `npm run build`。
- 项目进度写入 `docs/refactor-log.md`，通用方法才写入 `plan.md`。

## 运行时配置

后端地址和部分业务配置来自：

`public/static/common.js`

该文件从旧项目同步而来，包含：

- `baseApi`
- `readApi`
- `ywBaseApi`
- `ctiBaseAPi`
- `cti_webSocketBaseApi`
- `systemTitle`
- 接口白名单 `isReadArr`

如果登录或接口异常，优先检查这里的地址是否正确。

## 验证清单

每轮迁移后至少验证：

- `npm run build` 通过。
- `/login` 能正常登录。
- `/home` 能打开。
- 菜单、页签、刷新、关闭不报错。
- 登录状态、token、角色首页索引仍能读取。
- 通知 WebSocket 和 CTI WebSocket 不阻塞首页。
- 控制台没有关键运行时报错。

## 给后续迁移模型的最短上下文

如果新开对话继续迁移，可以这样描述：

```md
请在 `E:\jxt\新乡\new_kxt` 中继续迁移旧项目 `E:\jxt\新乡\kxt-one-number-web-quick`。
先阅读 `README.md`、`docs/refactor-log.md` 和 `plan.md`。
本轮只迁移一个旧角色首页，优先迁移当前 `localStorage.rolePageIndex` 对应的 `src/views/yht/*.vue`。
新代码使用 Vue 3 `<script setup>`、Element Plus、Pinia 和现有 `src/services/http.js`。
接口封装到 services，组件不要散落裸接口。
完成后更新 `docs/refactor-log.md` 并执行 `npm run build`。
不要回退已有代码，不要修改无关文件。
```
