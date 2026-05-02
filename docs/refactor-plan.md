# new_kxt 重构计划

## 五个核心原则

1. Plan Mode 先想清楚再动手。
2. 补好测试建立安全网。
3. 小步快跑，频繁提交。
4. 先保功能不崩，再优化代码质量。
5. 翻车及时复盘，记录经验迭代。

## 第一阶段目标

- 在 `new_kxt` 中建立 Vue 3 + Vite + Element Plus 的可运行骨架。
- 补齐路由、Pinia 状态、HTTP 服务层和迁移工作台。
- 保留旧项目只读参照，所有新代码都写入 `new_kxt`。
- 先跑通 `npm run build`，把构建作为最小安全网。

## 第一批高风险区域

- `kxt-one-number-web-quick/src/plugins/axios.js`：请求加密、响应解密、读写服务分流。
- `kxt-one-number-web-quick/src/main.js`：路由守卫、token 校验、全局 mixin、来电音频。
- `kxt-one-number-web-quick/src/views/Home.vue`：主框架、菜单、通知、用户操作和页面缓存。
- `kxt-one-number-web-quick/src/views/order`：工单登记、查询、流转，是最大业务域。
- `kxt-one-number-web-quick/src/utils/cti.js`：电话平台状态和 WebSocket 副作用。

## 迁移顺序建议

1. 工程骨架和构建安全网。
2. 运行时配置和 HTTP 兼容层。
3. 登录、token、SSO 和权限模型。
4. 主布局、菜单和页面缓存策略。
5. 工单模块按列表、详情、表单、流转动作拆分迁移。
6. CTI、知识库、通知、系统设置按依赖关系逐步迁移。

## 每轮提交检查

- 变更范围是否只覆盖一个主题。
- 是否能执行 `npm run build`。
- 是否记录了新增风险或经验。
- 是否避免了旧项目整文件格式化和编码污染。
