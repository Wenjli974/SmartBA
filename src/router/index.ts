import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/business-analysis'
    },
    {
      path: '/business-analysis',
      name: 'BusinessAnalysis',
      component: () => import('@/views/BusinessAnalysis.vue'),
      meta: {
        title: '业务分析'
      }
    },
    {
      path: '/function-analysis',
      name: 'FunctionAnalysis',
      component: () => import('@/views/FunctionAnalysis.vue'),
      meta: {
        title: '功能分析'
      },
      children: [
        {
          path: '',
          name: 'UserStory',
          component: () => import('@/views/UserStory.vue'),
          meta: {
            title: '用户故事'
          }
        },
        {
          path: 'requirements',
          name: 'Requirements',
          component: () => import('@/views/Requirements.vue'),
          meta: {
            title: '需求文档'
          }
        }
      ]
    },
    {
      path: '/uiux-expert',
      name: 'UIUXExpert',
      component: () => import('@/views/UIUXExpert.vue'),
      meta: {
        title: 'UI/UX 专家分析'
      }
    }
  ]
})

// 路由标题
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - SmartBA` || 'SmartBA'
  next()
})

export default router 