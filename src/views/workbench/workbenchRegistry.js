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

const migratedComponents = {
  ZxIndex,
  CbgIndex,
  DbzxIndex,
  LdspgIndex,
  FzgIndex,
  ZnjIndex,
  ZnjddzxIndex,
  HfIndex,
  BjshIndex
}

// 旧路由路径 → 新组件名（后端 roleIndexPage 返回的是旧路由路径如 zx/index）
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
  'admin/index': 'BlankPage'
}

function resolvePageName(rawPath) {
  const cleaned = rawPath.replace(/^\//, '').split('?')[0] || 'BlankPage'
  return legacyPathAliases[cleaned] || cleaned
}

export function resolveInternalPageComponent(path = '', query = {}) {
  const pageName = resolvePageName(path)

  if (pageName === 'notice/mine' || path.includes('notice/mine')) {
    return {
      component: NoticeMine,
      props: { query }
    }
  }

  if (pageName === 'BlankPage') {
    return {
      component: BlankPage,
      props: {}
    }
  }

  if (migratedComponents[pageName]) {
    return {
      component: migratedComponents[pageName],
      props: { pageName }
    }
  }

  return {
    component: null,
    props: { pageName }
  }
}
