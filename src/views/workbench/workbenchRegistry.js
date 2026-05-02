import RoleWorkbench from './RoleWorkbench.vue'
import BlankPage from './BlankPage.vue'

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

export function resolveInternalPageComponent(path = '') {
  const pageName = path.replace(/^\//, '').split('?')[0] || 'BlankPage'

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
