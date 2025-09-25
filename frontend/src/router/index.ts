import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import ProjectList from '@/views/ProjectList.vue'
import ProjectDetail from '@/views/ProjectDetail.vue'
import CalendarView from '@/views/CalendarView.vue'

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
    }
  ]
})

export default router