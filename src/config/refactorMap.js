export const refactorPrinciples = [
  {
    title: 'Plan Mode 先想清楚再动手',
    description: '每轮重构先确认目标、边界、验证方式和回滚点。',
    tone: 'cyan'
  },
  {
    title: '补好测试建立安全网',
    description: '先保留可运行、可构建、可冒烟验证的最小闭环。',
    tone: 'coral'
  },
  {
    title: '小步快跑，频繁提交',
    description: '一次只改一个清晰层次，避免业务和工程改造混在一起。',
    tone: 'yellow'
  },
  {
    title: '先保功能不崩，再优化代码质量',
    description: '优先保持登录、路由、接口、工单、电话平台等关键路径行为一致。',
    tone: 'blue'
  },
  {
    title: '翻车及时复盘，记录经验迭代',
    description: '把风险、决策和踩坑记录成文档，后续迁移按经验推进。',
    tone: 'green'
  }
]

export const legacyModules = [
  {
    key: 'foundation',
    name: '工程基础',
    legacyPath: 'src/main.js, src/App.vue, src/store.js',
    targetPath: 'src/main.js, src/router, src/stores',
    status: '进行中',
    risk: '中',
    notes: '先搭 Vue 3 + Vite 的应用骨架、路由、状态和全局样式。'
  },
  {
    key: 'runtime-config',
    name: '运行时配置',
    legacyPath: 'public/static/common.js, src/config.js',
    targetPath: 'src/services/http.js, src/config',
    status: '待迁移',
    risk: '高',
    notes: '旧项目依赖全局 common、base64 解码和读写服务分流，需要保持兼容。'
  },
  {
    key: 'auth',
    name: '登录与权限',
    legacyPath: 'src/views/login, src/utils/auth.js',
    targetPath: 'src/modules/auth',
    status: '待迁移',
    risk: '高',
    notes: 'token 校验、SSO、菜单权限和按钮权限是首批安全网重点。'
  },
  {
    key: 'layout',
    name: '主框架与菜单',
    legacyPath: 'src/views/Home.vue',
    targetPath: 'src/layouts/AppLayout.vue',
    status: '已起步',
    risk: '高',
    notes: '旧 Home.vue 同时承担菜单、通知、用户信息、页面缓存和业务跳转。'
  },
  {
    key: 'order',
    name: '工单业务',
    legacyPath: 'src/views/order, src/components/Orderinfo.vue',
    targetPath: 'src/modules/order',
    status: '待迁移',
    risk: '高',
    notes: '体量最大，先拆清单页、详情页、表单和流转动作，再迁具体逻辑。'
  },
  {
    key: 'cti',
    name: '电话平台 CTI',
    legacyPath: 'src/utils/cti.js, src/views/cti, src/views/monitor',
    targetPath: 'src/modules/cti',
    status: '待迁移',
    risk: '高',
    notes: '涉及 WebSocket、软电话状态、录音、来电提醒和全局状态。'
  },
  {
    key: 'knowledge',
    name: '知识库',
    legacyPath: 'src/views/zsk, src/utils/knowledge.js',
    targetPath: 'src/modules/knowledge',
    status: '待迁移',
    risk: '中',
    notes: '适合在接口兼容层稳定后分批迁移。'
  },
  {
    key: 'system',
    name: '系统设置',
    legacyPath: 'src/views/xtsz',
    targetPath: 'src/modules/system',
    status: '待迁移',
    risk: '中',
    notes: '包含部门、用户、角色、资源、字典、统计配置等后台管理能力。'
  }
]

export const refactorRisks = [
  '源码中文存在历史编码问题，迁移时避免整文件格式化。',
  '旧 axios 层会把部分 GET 转成 POST，并对多数请求/响应做 SM4 加解密。',
  '旧路由依赖 keepAlive 名称和缓存计数，直接改 route name 容易影响页面缓存。',
  'public/static/common.js 是运行时配置来源，不能只迁编译期配置。',
  '工单和 CTI 模块有大量全局状态、浏览器存储和跨页面副作用。'
]
