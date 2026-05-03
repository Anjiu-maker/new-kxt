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

import AddOrder from '@/views/order/AddOrder.vue'
import AddOrderQuick from '@/views/order/AddOrder-quick.vue'
import AddOrderSpecial from '@/views/order/AddOrder-special.vue'
import Cfdb from '@/views/order/Cfdb.vue'
import FlowCommonList from '@/views/order/FlowCommonList.vue'
import Fzgth from '@/views/order/Fzgth.vue'
import Rwfpmx from '@/views/order/Rwfpmx.vue'
import Zcsw from '@/views/order/Zcsw.vue'
import ZcswAll from '@/views/order/ZcswAll.vue'
import ZcswSpecial from '@/views/order/ZcswSpecial.vue'

import AddressBook from '@/views/informationquery/AddressBook.vue'
import CaseOpen from '@/views/informationquery/CaseOpen.vue'
import Citizen from '@/views/informationquery/Citizen.vue'
import IntegratedQuery from '@/views/informationquery/IntegratedQuery.vue'
import MyOrder from '@/views/informationquery/MyOrder.vue'
import QueryItem from '@/views/informationquery/QueryItem.vue'
import QueryReportItem from '@/views/informationquery/QueryReportItem.vue'
import QueryTemplate from '@/views/informationquery/QueryTemplate.vue'
import ReportDataQuery from '@/views/informationquery/ReportDataQuery.vue'

const migratedComponents = {
  BlankPage,
  ZxIndex,
  CbgIndex,
  DbzxIndex,
  LdspgIndex,
  FzgIndex,
  ZnjIndex,
  ZnjddzxIndex,
  HfIndex,
  BjshIndex,
  AddOrder,
  AddOrderQuick,
  AddOrderSpecial,
  Cfdb,
  FlowCommonList,
  Fzgth,
  Rwfpmx,
  Zcsw,
  ZcswAll,
  ZcswSpecial,
  AddressBook,
  CaseOpen,
  Citizen,
  IntegratedQuery,
  MyOrder,
  QueryItem,
  QueryReportItem,
  QueryTemplate,
  ReportDataQuery
}

const legacyPathAliases = {
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
  'order/addOrder': 'AddOrder',
  'order/editOrder': 'AddOrder',
  'order/quickAddOrder': 'AddOrderQuick',
  'order/specialAddOrder': 'AddOrderSpecial',
  'order/fzgth': 'Fzgth',
  'order/cfdb': 'Cfdb',
  'order/zcsw': 'Zcsw',
  'order/zcswAll': 'ZcswAll',
  'order/zcswSpecial': 'ZcswSpecial',
  'xxcx/rwfpmx': 'Rwfpmx',
  'query/integratedQuery': 'IntegratedQuery',
  'query/myOrder': 'MyOrder',
  'xxcx/mytask': 'MyOrder',
  'query/citizen': 'Citizen',
  'xxcx/citizen': 'Citizen',
  'query/caseOpen': 'CaseOpen',
  'xxcx/caseOpen': 'CaseOpen',
  'query/addressBook': 'AddressBook',
  'xxcx/txl': 'AddressBook',
  'query/reportDataQuery': 'ReportDataQuery',
  'query/queryItem': 'QueryItem',
  'query/item': 'QueryItem',
  'query/queryTemplate': 'QueryTemplate',
  'query/template': 'QueryTemplate',
  'query/queryReportItem': 'QueryReportItem',
  'query/reportItem': 'QueryReportItem',
  'query/SampleLibrary': 'IntegratedQuery'
}

function resolvePageName(rawPath) {
  const cleaned = rawPath.replace(/^\//, '').split('?')[0] || 'BlankPage'

  if (legacyPathAliases[cleaned]) {
    return legacyPathAliases[cleaned]
  }

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

  if (migratedComponents[pageName]) {
    const props = { pageName, query, rawPath }
    if (pageName === 'FlowCommonList') {
      props.md = rawPath.replace('flow/order/', '')
    }
    return { component: migratedComponents[pageName], props }
  }

  return { component: null, props: { pageName } }
}
