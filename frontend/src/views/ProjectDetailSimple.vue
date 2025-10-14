<template>
  <div class="project-detail">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-loading text="加载中..." :fullscreen="false" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-result
        icon="error"
        title="加载失败"
        :sub-title="error">
        <template #extra>
          <el-button type="primary" @click="loadProject">重新加载</el-button>
          <el-button @click="router.back()">返回</el-button>
        </template>
      </el-result>
    </div>

    <!-- 项目详情内容 -->
    <div v-else-if="project" class="detail-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/projects' }">项目管理</el-breadcrumb-item>
          <el-breadcrumb-item>{{ project.title }}</el-breadcrumb-item>
        </el-breadcrumb>

        <div class="header-actions">
          <el-button type="primary" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
        </div>
      </div>

      <!-- 项目基本信息 -->
      <el-row :gutter="20" class="info-section">
        <el-col :span="16">
          <el-card class="project-info-card">
            <template #header>
              <div class="card-header">
                <span>📋 项目信息</span>
                <el-tag
                  :type="getStatusType(project.status)"
                  size="large"
                >
                  {{ getStatusText(project.status) }}
                </el-tag>
              </div>
            </template>

            <el-descriptions :column="1" border>
              <el-descriptions-item label="项目名称">
                <span class="project-title">{{ project.title }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="项目目标" v-if="project.goal">
                <span class="project-goal">{{ project.goal }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="负责人" v-if="project.manager">
                <span>{{ project.manager }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="参与人员" v-if="project.participants">
                <span>{{ project.participants }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-tag :type="getPriorityType(project.priority)">
                  {{ getPriorityText(project.priority) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="开始日期" v-if="project.start_date">
                <span>{{ formatDate(project.start_date) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="结束日期" v-if="project.end_date">
                <span>{{ formatDate(project.end_date) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                <span>{{ formatDateTime(project.created_at) }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <el-col :span="8">
          <!-- 任务统计 -->
          <el-card class="stats-card">
            <template #header>
              <span>📊 任务统计</span>
            </template>

            <div class="stats-content">
              <div class="stat-item">
                <span class="stat-label">总任务数</span>
                <span class="stat-value">{{ project.task_count || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已完成</span>
                <span class="stat-value completed">{{ project.completed_task_count || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">完成率</span>
                <span class="stat-value">{{ completionRate }}%</span>
              </div>
              <div class="progress-bar">
                <el-progress
                  :percentage="completionRate"
                  :status="completionRate === 100 ? 'success' : 'text'"
                />
              </div>
            </div>
          </el-card>

          <!-- AI聊天面板 -->
          <AIChatPanel :project-id="projectId" />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import AIChatPanel from '@/components/AIChatPanel.vue'
import type { Project } from '@/types'

// 路由
const route = useRoute()
const router = useRouter()

// Store
const projectStore = useProjectStore()

// Props
const projectId = computed(() => Number(route.params.id))

// 状态
const loading = ref(false)
const error = ref('')
const project = ref<Project | null>(null)

// 计算属性
const completionRate = computed(() => {
  if (!project.value || !project.value.task_count || project.value.task_count === 0) return 0
  return Math.round(((project.value.completed_task_count || 0) / project.value.task_count) * 100)
})

// 获取项目详情
const loadProject = async () => {
  if (!projectId.value) return

  loading.value = true
  error.value = ''

  try {
    // 直接使用项目列表中的数据，如果没有则显示错误
    const foundProject = projectStore.projects.find(p => p.id === projectId.value)
    if (foundProject) {
      project.value = foundProject
    } else {
      error.value = '未找到项目'
    }
  } catch (err) {
    error.value = '加载项目时发生错误'
    console.error('加载项目失败:', err)
  } finally {
    loading.value = false
  }
}

// 返回项目列表
const goBack = () => {
  router.push('/projects')
}

// 状态相关函数
const getStatusType = (status: string) => {
  switch (status) {
    case 'Planning': return 'info'
    case 'InProgress': return 'primary'
    case 'Completed': return 'success'
    case 'OnHold': return 'warning'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'Planning': return '规划中'
    case 'InProgress': return '进行中'
    case 'Completed': return '已完成'
    case 'OnHold': return '暂停'
    default: return status
  }
}

const getPriorityType = (priority: string) => {
  switch (priority) {
    case 'High': return 'danger'
    case 'Medium': return 'warning'
    case 'Low': return 'info'
    default: return 'info'
  }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'High': return '高'
    case 'Medium': return '中'
    case 'Low': return '低'
    default: return priority
  }
}

// 日期格式化
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 初始化
onMounted(() => {
  loadProject()
})
</script>

<style scoped>
.project-detail {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.info-section {
  margin-bottom: 20px;
}

.project-info-card,
.stats-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.project-goal {
  color: #606266;
  line-height: 1.5;
}

.stats-content {
  padding: 10px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-value.completed {
  color: #67c23a;
}

.progress-bar {
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .project-detail {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-actions {
    flex-wrap: wrap;
  }
}
</style>
"file_path":"C:\Users\songchunyan\Desktop\项目管理\project-manager\frontend\src\views\ProjectDetailSimple.vue"}