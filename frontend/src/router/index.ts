import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import ProjectList from '@/views/ProjectList.vue'
import ProjectDetail from '@/views/ProjectDetail.vue'
import CalendarView from '@/views/CalendarView.vue'
import AIChatTest from '@/views/AIChatTest.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard
    },
    {
      path: '/projects',
      name: 'ProjectList',
      component: ProjectList
    },
    {
      path: '/projects/:id',
      name: 'ProjectDetail',
      component: ProjectDetail,
      props: true
    },
    {
      path: '/calendar',
      name: 'CalendarView',
      component: CalendarView
    },
    {
      path: '/ai-chat-test',
      name: 'AIChatTest',
      component: AIChatTest
    }
  ]
})

export default router