import RoleWorkbench from './RoleWorkbench.vue'
import BlankPage from './BlankPage.vue'
import NoticeMine from '@/views/notice/NoticeMine.vue'

const supportedWorkbenchPages = new Set([
  'ZxIndex',
  'CbgIndex',
  'DbzxIndex',
  'LdspgIndex',
  'FzgIndex',
  'ZnjIndex',
  'ZnjddzxIndex',
  'HfIndex',
  'BjshIndex'
])

export function resolveInternalPageComponent(path = '', query = {}) {
  const pageName = path.replace(/^\//, '').split('?')[0] || 'BlankPage'

  if (pageName === 'notice/mine') {
    return {
      component: NoticeMine,
      props: {
        query
      }
    }
  }

  if (pageName === 'BlankPage') {
    return {
      component: BlankPage,
      props: {}
    }
  }

  if (supportedWorkbenchPages.has(pageName)) {
    return {
      component: RoleWorkbench,
      props: {
        pageName
      }
    }
  }

  return {
    component: null,
    props: {
      pageName
    }
  }
}
