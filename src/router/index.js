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
