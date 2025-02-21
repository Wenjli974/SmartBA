import { createApp } from 'vue'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'UserStory',
      component: () => import('./views/UserStory.vue')
    },
    {
      path: '/requirements',
      name: 'Requirements',
      component: () => import('./views/Requirements.vue')
    }
  ]
})

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)
app.mount('#app')
