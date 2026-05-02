import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/Login.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/home/Home.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/migration',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'migration-dashboard',
        component: () => import('@/views/migration/Dashboard.vue'),
        meta: {
          title: '重构工作台'
        }
      }
    ]
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
      query: {
        redirect: to.fullPath
      }
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
