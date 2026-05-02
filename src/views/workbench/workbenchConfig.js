const agentMetrics = [
  { key: 'zcgd', label: '暂存', api: 'orderInfo/zcgd_order_list', tone: 'blue' },
  { key: 'thgd', label: '退回', api: 'orderInfo/fzgth_order_list', tone: 'orange' },
  { key: 'tbgzgd', label: '特别关注', api: 'orderInfo/tbgz_order_list', tone: 'red' },
  { key: 'ywcgd', label: '今日完成', api: 'orderInfo/today_over_order_list', tone: 'green' },
  { key: 'ycqgd', label: '预超期', api: 'orderInfo/zxycq_order_list', tone: 'yellow' }
]

const revisitMetrics = [
  { key: 'dhf', label: '待回访', api: 'orderInfo/my_dhf_order_list', tone: 'blue' },
  { key: 'dgd', label: '待归档', api: 'orderInfo/dgd_order_list', tone: 'green' },
  { key: 'dyp', label: '待研判', api: 'orderInfo/dyp_order_list', tone: 'orange' },
  { key: 'dypz', label: '待研判总', api: 'orderInfo/dyp_all_order_list', tone: 'red' }
]

const znjMetrics = [
  { key: 'djsgd', label: '待接收', api: 'orderInfo/djs_order_list', tone: 'blue' },
  { key: 'dfkgd', label: '待反馈', api: 'orderInfo/dfk_order_list', tone: 'green' },
  { key: 'cbgd', label: '重办', api: 'orderInfo/cb_order_list', tone: 'orange' },
  { key: 'ldpsgd', label: '领导批示', api: 'orderInfo/znjdd_ldps_order_list', tone: 'red' },
  { key: 'dypgd', label: '待研判', api: 'orderInfo/dyp_my_order_list', tone: 'yellow' },
  { key: 'bmzsd', label: '部门知识点', api: 'knowledgeBase/condition_list', params: { state: 4 }, tone: 'slate' }
]

const fzgMetrics = [
  { key: 'dfp', label: '待分派', api: 'orderInfo/dfp_order_list', tone: 'blue' },
  { key: 'sp', label: '审批', api: 'orderInfo/fzg_sp_order_list', valuePath: 'records.length', tone: 'orange' },
  { key: 'gdsp', label: '归档审批', api: 'orderInfo/fzg_gdsp_order_list', valuePath: 'records.length', tone: 'green' },
  { key: 'dgj', label: '待跟进', api: 'orderInfo/dgj_order_list', tone: 'yellow' }
]

const fzgWarnings = [
  { key: 'fzg_yyqgd', label: '预逾期事务', api: 'orderInfo/fzg_yyqgd_order_list' },
  { key: 'fzg_yqgd', label: '逾期事务', api: 'orderInfo/fzg_yqgd_order_list' },
  { key: 'fzg_ldps', label: '领导批示', api: 'orderInfo/fzg_ldps_order_list' },
  { key: 'fzg_yfpgd', label: '已分派事务(今日)', api: 'orderInfo/fzg_yfpgd_order_list' }
]

const znjWarnings = [
  { key: 'znj_yyqgd', label: '预逾期', api: 'orderInfo/znj_yyqgd_order_list' },
  { key: 'znj_yqgd', label: '逾期', api: 'orderInfo/yqgd_order_list' },
  { key: 'znj_ysbgd', label: '已上报(今日)', api: 'orderInfo/znj_sbgd_order_list' }
]

const revisitWarnings = [
  { key: 'hf_csdhfgd', label: '超时待回访', api: 'orderInfo/hf_csdhfgd_order_list' },
  { key: 'hf_yhfgd', label: '已回访', api: 'orderInfo/hf_yhfgd_order_list' },
  { key: 'hf_yhfcs', label: '已回访次数', api: 'orderInfo/hf_gdhfcs_order_list' }
]

export const workbenchConfigs = {
  BlankPage: {
    title: '欢迎首页',
    subtitle: '当前角色未配置专属首页，系统已显示基础工作台。',
    metrics: [],
    warnings: []
  },
  ZxIndex: {
    title: '坐席工作台',
    subtitle: '同步旧坐席首页的事务概览、公告和待办入口。',
    metrics: agentMetrics,
    warnings: [
      { key: 'sjly', label: '交互数据', api: 'orderInfo/zx_sjlydata_order_list' }
    ],
    todoApi: 'orderInfo/zcgd_order_list'
  },
  CbgIndex: {
    title: '催办工作台',
    subtitle: '同步催办中心的待催办、申请、短信和电话提醒概览。',
    metrics: [
      { key: 'dbspz', label: '待审批', api: 'orderInfo/dbspzOrder', tone: 'blue' },
      { key: 'bydb', label: '本月待办', api: 'orderInfo/bydbOrder', tone: 'green' },
      { key: 'red', label: '红色催办', api: 'orderInfo/remindersRed', tone: 'red' },
      { key: 'msg', label: '短信催办', api: 'orderInfo/messageReminders', tone: 'orange' },
      { key: 'call', label: '电话催办', api: 'orderInfo/callReminders', tone: 'yellow' }
    ],
    warnings: [],
    todoApi: 'orderInfo/callReminders'
  },
  DbzxIndex: {
    title: '督办中心工作台',
    subtitle: '同步督办中心的未响应、超期、申请单和督查数据。',
    metrics: [
      { key: 'nonResponse', label: '未响应', api: 'orderInfo/allNonResponse', tone: 'blue' },
      { key: 'overDue', label: '全部超期', api: 'orderInfo/allOverDueOrder', tone: 'red' },
      { key: 'sqd', label: '申请单', api: 'orderInfo/dbsp_sqd', tone: 'orange' },
      { key: 'registered', label: '登记督办', api: 'orderInfo/registeredSupervisor', tone: 'green' },
      { key: 'supervising', label: '全部督办', api: 'orderInfo/supervisingAll', tone: 'yellow' }
    ],
    warnings: [],
    todoApi: 'orderInfo/registeredSupervisor'
  },
  LdspgIndex: {
    title: '领导派工工作台',
    subtitle: '同步领导派工角色的坐席类概览和待处理事务。',
    metrics: agentMetrics,
    warnings: [],
    todoApi: 'orderInfo/zcgd_order_list'
  },
  FzgIndex: {
    title: '分转岗工作台',
    subtitle: '同步分转岗首页的分派、审批、预警和公告概览。',
    metrics: fzgMetrics,
    warnings: fzgWarnings,
    todoApi: 'orderInfo/dfp_order_list'
  },
  ZnjIndex: {
    title: '职能局工作台',
    subtitle: '同步职能局首页的待接收、反馈、重办、研判与知识点概览。',
    metrics: znjMetrics,
    warnings: znjWarnings,
    todoApi: 'orderInfo/djs_order_list'
  },
  ZnjddzxIndex: {
    title: '职能局调度工作台',
    subtitle: '同步调度中心首页的接收、反馈、重办、批示和下级数据。',
    metrics: znjMetrics,
    warnings: [
      { key: 'znjdd_yyqgd', label: '预逾期', api: 'orderInfo/znjdd_yyqgd_order_list' },
      { key: 'znjdd_yqgd', label: '逾期', api: 'orderInfo/znjdd_yqgd_order_list' },
      { key: 'znjdd_ldps', label: '领导批示', api: 'orderInfo/znjdd_ldps_order_list' },
      { key: 'znjdd_yfpgd', label: '已分派(今日)', api: 'orderInfo/znjdd_yfpgd_order_list' }
    ],
    todoApi: 'orderInfo/djs_order_list'
  },
  HfIndex: {
    title: '回访工作台',
    subtitle: '同步回访岗首页的待回访、归档、研判和回访统计。',
    metrics: revisitMetrics,
    warnings: revisitWarnings,
    todoApi: 'orderInfo/my_dhf_order_list'
  },
  BjshIndex: {
    title: '办结审核工作台',
    subtitle: '同步审核类首页的回访、归档、研判和统计概览。',
    metrics: revisitMetrics,
    warnings: revisitWarnings,
    todoApi: 'orderInfo/my_dhf_order_list'
  }
}

export function resolveWorkbenchConfig(pageName) {
  return workbenchConfigs[pageName] ?? {
    ...workbenchConfigs.BlankPage,
    title: pageName ? `${pageName} 工作台` : workbenchConfigs.BlankPage.title,
    subtitle: '该角色首页已接入新框架，具体业务模块会继续按旧页面逐块迁移。',
    sourcePage: pageName
  }
}
