import { createRouter, createWebHistory } from 'vue-router'
import WorkflowView from '../views/WorkflowView.vue'

const routes = [
  { path: '/', name: 'workflow', component: WorkflowView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
