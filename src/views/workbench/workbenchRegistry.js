import BlankPage from './BlankPage.vue'
import ZxIndex from './ZxIndex.vue'
import CbgIndex from './CbgIndex.vue'
import DbzxIndex from './DbzxIndex.vue'
import LdspgIndex from './LdspgIndex.vue'
import FzgIndex from './FzgIndex.vue'
import ZnjIndex from './ZnjIndex.vue'
import ZnjddzxIndex from './ZnjddzxIndex.vue'
import HfIndex from './HfIndex.vue'
import BjshIndex from './BjshIndex.vue'
import NoticeMine from '@/views/notice/NoticeMine.vue'

// ── 工单模块页面 ──
import Fzgth from '@/views/order/Fzgth.vue'
import Cfdb from '@/views/order/Cfdb.vue'
import Zcsw from '@/views/order/Zcsw.vue'
import ZcswAll from '@/views/order/ZcswAll.vue'
import ZcswSpecial from '@/views/order/ZcswSpecial.vue'
import Rwfpmx from '@/views/order/Rwfpmx.vue'
import FlowCommonList from '@/views/order/FlowCommonList.vue'
import AddOrder from '@/views/order/AddOrder.vue'
import AddOrderQuick from '@/views/order/AddOrder-quick.vue'
import AddOrderSpecial from '@/views/order/AddOrder-special.vue'

const migratedComponents = {
  // 工作台首页
  ZxIndex, CbgIndex, DbzxIndex, LdspgIndex, FzgIndex,
  ZnjIndex, ZnjddzxIndex, HfIndex, BjshIndex,
  // 工单列表页
  Fzgth, Cfdb, Zcsw, ZcswAll, ZcswSpecial, Rwfpmx,
  // 工单流转/表单页
  FlowCommonList, AddOrder, AddOrderQuick, AddOrderSpecial
}

// 旧路由路径 → 组件名
const legacyPathAliases = {
  // 工作台首页
  'zx/index': 'ZxIndex',
  'fzg/index': 'FzgIndex',
  'cbg/index': 'CbgIndex',
  'dbzx/index': 'DbzxIndex',
  'ldspg/index': 'LdspgIndex',
  'znj/index': 'ZnjIndex',
  'znjddzx/index': 'ZnjddzxIndex',
  'hf/index': 'HfIndex',
  'bjsh/index': 'BjshIndex',
  'admin/index': 'BlankPage',
  // 工单列表页
  'order/fzgth': 'Fzgth',
  'order/cfdb': 'Cfdb',
  'order/zcsw': 'Zcsw',
  'order/zcswAll': 'ZcswAll',
  'order/zcswSpecial': 'ZcswSpecial',
  'xxcx/rwfpmx': 'Rwfpmx',
  // 工单表单页
  'order/addOrder': 'AddOrder',
  'order/editOrder': 'AddOrder',
  'order/quickAddOrder': 'AddOrderQuick',
  'order/specialAddOrder': 'AddOrderSpecial'
}

function resolvePageName(rawPath) {
  const cleaned = rawPath.replace(/^\//, '').split('?')[0] || 'BlankPage'

  // 直接别名匹配
  if (legacyPathAliases[cleaned]) {
    return legacyPathAliases[cleaned]
  }

  // FlowCommonList: /flow/order/xxx 格式
  if (cleaned.startsWith('flow/order/')) {
    return 'FlowCommonList'
  }

  return cleaned
}

export function resolveInternalPageComponent(path = '', query = {}) {
  const rawPath = path.replace(/^\//, '').split('?')[0] || 'BlankPage'
  const pageName = resolvePageName(path)

  if (pageName === 'notice/mine' || path.includes('notice/mine')) {
    return { component: NoticeMine, props: { query } }
  }

  if (pageName === 'BlankPage') {
    return { component: BlankPage, props: {} }
  }

  if (migratedComponents[pageName]) {
    // 提取 FlowCommonList 的 md 参数
    const props = { pageName, query, rawPath }
    if (pageName === 'FlowCommonList') {
      props.md = rawPath.replace('flow/order/', '')
    }
    return { component: migratedComponents[pageName], props }
  }

  return { component: null, props: { pageName } }
}
