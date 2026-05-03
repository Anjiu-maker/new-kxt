import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const HomeRouteView = { name: 'HomeRouteView', render: () => null }

const withHomeCache = (route) => ({
  ...route,
  meta: { ...(route.meta ?? {}), keepAlive: true }
})

const homeChildren = [
  { path: 'home', name: 'homeIndex', component: HomeRouteView, meta: { title: 'Home' } },
  { path: 'BlankPage', name: 'BlankPage', component: HomeRouteView, meta: { title: 'BlankPage' } },
  { path: 'ZxIndex', name: 'ZxIndex', component: HomeRouteView, meta: { title: 'ZxIndex' } },
  { path: 'FzgIndex', name: 'FzgIndex', component: HomeRouteView, meta: { title: 'FzgIndex' } },
  { path: 'CbgIndex', name: 'CbgIndex', component: HomeRouteView, meta: { title: 'CbgIndex' } },
  { path: 'DbzxIndex', name: 'DbzxIndex', component: HomeRouteView, meta: { title: 'DbzxIndex' } },
  { path: 'LdspgIndex', name: 'LdspgIndex', component: HomeRouteView, meta: { title: 'LdspgIndex' } },
  { path: 'ZnjIndex', name: 'ZnjIndex', component: HomeRouteView, meta: { title: 'ZnjIndex' } },
  { path: 'ZnjddzxIndex', name: 'ZnjddzxIndex', component: HomeRouteView, meta: { title: 'ZnjddzxIndex' } },
  { path: 'HfIndex', name: 'HfIndex', component: HomeRouteView, meta: { title: 'HfIndex' } },
  { path: 'BjshIndex', name: 'BjshIndex', component: HomeRouteView, meta: { title: 'BjshIndex' } },
  { path: 'zx/index', name: 'zxIndex', component: HomeRouteView, meta: { title: 'ZxIndex' } },
  { path: 'fzg/index', name: 'fzgIndex', component: HomeRouteView, meta: { title: 'FzgIndex' } },
  { path: 'cbg/index', name: 'cbgIndex', component: HomeRouteView, meta: { title: 'CbgIndex' } },
  { path: 'dbzx/index', name: 'dbzxIndex', component: HomeRouteView, meta: { title: 'DbzxIndex' } },
  { path: 'ldspg/index', name: 'ldspgIndex', component: HomeRouteView, meta: { title: 'LdspgIndex' } },
  { path: 'znj/index', name: 'znjIndex', component: HomeRouteView, meta: { title: 'ZnjIndex' } },
  { path: 'znjddzx/index', name: 'znjddzxIndex', component: HomeRouteView, meta: { title: 'ZnjddzxIndex' } },
  { path: 'hf/index', name: 'hfIndex', component: HomeRouteView, meta: { title: 'HfIndex' } },
  { path: 'bjsh/index', name: 'bjshIndex', component: HomeRouteView, meta: { title: 'BjshIndex' } },
  { path: 'admin/index', name: 'adminIndex', component: HomeRouteView, meta: { title: 'BlankPage' } },
  { path: 'notice/mine', name: 'noticeMine', component: HomeRouteView, meta: { title: 'Notice Mine' } },
  { path: 'order/addOrder', name: 'addOrder', component: HomeRouteView, meta: { title: 'Add Order' } },
  { path: 'order/editOrder', name: 'editOrder', component: HomeRouteView, meta: { title: 'Edit Order' } },
  { path: 'order/quickAddOrder', name: 'quickAddOrder', component: HomeRouteView, meta: { title: 'Quick Add Order' } },
  { path: 'order/specialAddOrder', name: 'specialAddOrder', component: HomeRouteView, meta: { title: 'Special Add Order' } },
  { path: 'flow/order/:md', name: 'flowOrder', component: HomeRouteView, meta: { title: 'Flow Order' } },
  { path: 'order/fzgth', name: 'fzgth', component: HomeRouteView, meta: { title: 'Fzgth' } },
  { path: 'order/cfdb', name: 'cfdb', component: HomeRouteView, meta: { title: 'Cfdb' } },
  { path: 'order/zcsw', name: 'zcsw', component: HomeRouteView, meta: { title: 'Zcsw' } },
  { path: 'order/zcswAll', name: 'zcswAll', component: HomeRouteView, meta: { title: 'Zcsw All' } },
  { path: 'order/zcswSpecial', name: 'zcswSpecial', component: HomeRouteView, meta: { title: 'Zcsw Special' } },
  { path: 'xxcx/rwfpmx', name: 'rwfpmx', component: HomeRouteView, meta: { title: 'Rwfpmx' } },
  { path: 'query/integratedQuery', name: 'integratedQuery', component: HomeRouteView, meta: { title: 'Integrated Query' } },
  { path: 'query/myOrder', name: 'myOrder', component: HomeRouteView, meta: { title: 'My Order' } },
  { path: 'xxcx/mytask', name: 'myTask', component: HomeRouteView, meta: { title: 'My Task' } },
  { path: 'query/citizen', name: 'citizen', component: HomeRouteView, meta: { title: 'Citizen' } },
  { path: 'xxcx/citizen', name: 'citizenLegacy', component: HomeRouteView, meta: { title: 'Citizen' } },
  { path: 'query/caseOpen', name: 'caseOpen', component: HomeRouteView, meta: { title: 'Case Open' } },
  { path: 'xxcx/caseOpen', name: 'caseOpenLegacy', component: HomeRouteView, meta: { title: 'Case Open' } },
  { path: 'query/addressBook', name: 'addressBook', component: HomeRouteView, meta: { title: 'Address Book' } },
  { path: 'xxcx/txl', name: 'addressbookLegacy', component: HomeRouteView, meta: { title: 'Address Book' } },
  { path: 'query/reportDataQuery', name: 'reportDataQuery', component: HomeRouteView, meta: { title: 'Report Data Query' } },
  { path: 'query/queryItem', name: 'queryItem', component: HomeRouteView, meta: { title: 'Query Item' } },
  { path: 'query/item', name: 'item', component: HomeRouteView, meta: { title: 'Query Item' } },
  { path: 'query/queryTemplate', name: 'queryTemplate', component: HomeRouteView, meta: { title: 'Query Template' } },
  { path: 'query/template', name: 'template', component: HomeRouteView, meta: { title: 'Query Template' } },
  { path: 'query/queryReportItem', name: 'queryReportItem', component: HomeRouteView, meta: { title: 'Query Report Item' } },
  { path: 'query/reportItem', name: 'reportItem', component: HomeRouteView, meta: { title: 'Query Report Item' } },
  { path: 'query/SampleLibrary', name: 'SampleLibrary', component: HomeRouteView, meta: { title: 'Sample Library' } },
  { path: ':pathMatch(.*)*', name: 'homeFallback', component: HomeRouteView }
].map(withHomeCache)

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/Login.vue'),
    meta: { title: 'Login' }
  },
  {
    path: '/migration',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'migration-dashboard',
        component: () => import('@/views/migration/Dashboard.vue'),
        meta: { title: 'Migration Dashboard' }
      }
    ]
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/Home.vue'),
    redirect: '/home',
    children: homeChildren
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home'
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  NProgress.start()

  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
  if (to.path !== '/login' && !token) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }

  document.title = to.meta?.title ? `${to.meta.title} - new_kxt` : 'new_kxt'
})

router.afterEach(() => {
  NProgress.done()
})

router.onError(() => {
  NProgress.done()
})
