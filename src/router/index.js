import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/home/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/notice/mine',
    name: 'noticeMine',
    component: () => import('@/views/notice/NoticeMine.vue'),
    props: (route) => ({ query: route.query }),
    meta: { title: '我的公告' }
  },
  {
    path: '/migration',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'migration-dashboard',
        component: () => import('@/views/migration/Dashboard.vue'),
        meta: { title: '重构工作台' }
      }
    ]
  },
  {
    path: '/order/addOrder',
    name: 'addOrder',
    component: () => import('@/views/order/AddOrder.vue'),
    meta: { title: '新增工单' }
  },
  {
    path: '/order/editOrder',
    name: 'editOrder',
    component: () => import('@/views/order/AddOrder.vue'),
    meta: { title: '编辑工单' }
  },
  {
    path: '/order/quickAddOrder',
    name: 'quickAddOrder',
    component: () => import('@/views/order/AddOrder-quick.vue'),
    meta: { title: '快速受理' }
  },
  {
    path: '/order/specialAddOrder',
    name: 'specialAddOrder',
    component: () => import('@/views/order/AddOrder-special.vue'),
    meta: { title: '专项诉求' }
  },
  {
    path: '/flow/order/:md',
    name: 'flowOrder',
    component: () => import('@/views/order/FlowCommonList.vue'),
    meta: { title: '流转列表' }
  },
  {
    path: '/order/fzgth',
    name: 'fzgth',
    component: () => import('@/views/order/Fzgth.vue'),
    meta: { title: '分转岗退回' }
  },
  {
    path: '/order/cfdb',
    name: 'cfdb',
    component: () => import('@/views/order/Cfdb.vue'),
    meta: { title: '重复督办' }
  },
  {
    path: '/order/zcsw',
    name: 'zcsw',
    component: () => import('@/views/order/Zcsw.vue'),
    meta: { title: '暂存事务' }
  },
  {
    path: '/order/zcswAll',
    name: 'zcswAll',
    component: () => import('@/views/order/ZcswAll.vue'),
    meta: { title: '全部暂存事务' }
  },
  {
    path: '/order/zcswSpecial',
    name: 'zcswSpecial',
    component: () => import('@/views/order/ZcswSpecial.vue'),
    meta: { title: '专项暂存事务' }
  },
  {
    path: '/xxcx/rwfpmx',
    name: 'rwfpmx',
    component: () => import('@/views/order/Rwfpmx.vue'),
    meta: { title: '任务分配明细' }
  },
  // ── informationquery (综合查询) ──
  {
    path: '/query',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      {
        path: 'integratedQuery',
        name: 'integratedQuery',
        component: () => import('@/views/informationquery/IntegratedQuery.vue'),
        meta: { title: '综合查询' }
      },
      {
        path: 'myOrder',
        name: 'myOrder',
        component: () => import('@/views/informationquery/MyOrder.vue'),
        meta: { title: '我的工单' }
      },
      {
        path: 'citizen',
        name: 'citizen',
        component: () => import('@/views/informationquery/Citizen.vue'),
        meta: { title: '群众信息' }
      },
      {
        path: 'caseOpen',
        name: 'caseOpen',
        component: () => import('@/views/informationquery/CaseOpen.vue'),
        meta: { title: '案例公开' }
      },
      {
        path: 'addressBook',
        name: 'addressBook',
        component: () => import('@/views/informationquery/AddressBook.vue'),
        meta: { title: '通讯录' }
      },
      {
        path: 'reportDataQuery',
        name: 'reportDataQuery',
        component: () => import('@/views/informationquery/ReportDataQuery.vue'),
        meta: { title: '报表数据' }
      },
      {
        path: 'queryItem',
        name: 'queryItem',
        component: () => import('@/views/informationquery/QueryItem.vue'),
        meta: { title: '查询条件项' }
      },
      {
        path: 'queryTemplate',
        name: 'queryTemplate',
        component: () => import('@/views/informationquery/QueryTemplate.vue'),
        meta: { title: '查询模板' }
      },
      {
        path: 'queryReportItem',
        name: 'queryReportItem',
        component: () => import('@/views/informationquery/QueryReportItem.vue'),
        meta: { title: '导出字段' }
      },
      {
        path: 'SampleLibrary',
        name: 'SampleLibrary',
        component: () => import('@/views/informationquery/IntegratedQuery.vue'),
        meta: { title: '样本库' }
      }
    ]
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
