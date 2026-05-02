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

export function resolveInternalPageComponent(path = '', query = {}) {
  const pageName = path.replace(/^\//, '').split('?')[0] || 'BlankPage'

  if (pageName === 'notice/mine') {
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
