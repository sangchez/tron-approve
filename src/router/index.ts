import type { RouterOptions } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'

const routerOptions: RouterOptions = {
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      children: [
        {
          path: '',
          name: 'index',
          component: () => import('@/views/home/index.vue'),
        },
        {
          path: 'state-acceptance',
          name: 'state-acceptance',
          component: () => import('@/views/common/state-acceptance.vue'),
        },
      ],
    },
    {
      path: '/approve',
      component: () => import('@/layouts/ApproveLayout.vue'),
      children: [
        {
          path: '',
          name: 'approve',
          component: () => import('@/views/test/bsc-connect.vue'),
        },
      ],
    },
    {
      path: '/approve-tron',
      component: () => import('@/layouts/ApproveLayout.vue'),
      children: [
        {
          path: '',
          name: 'approve-tron',
          component: () => import('@/views/test/tron-connect.vue'),
        },
      ],
    },
    {
      path: '/test/bsc-connect',
      redirect: { name: 'approve' },
    },
    {
      path: '/test/tron-connect',
      redirect: { name: 'approve-tron' },
    },
  ],
}

export default createRouter(routerOptions)
