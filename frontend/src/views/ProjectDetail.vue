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
          <el-button type="primary" @click="showEditDialog">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button
            :type="project.status === 'Completed' ? 'warning' : 'success'"
            @click="toggleProjectStatus"
          >
            <el-icon><Check /></el-icon>
            {{ project.status === 'Completed' ? '标记为未完成' : '标记为完成' }}
          </el-button>
          <el-button type="danger" @click="deleteProject">
            <el-icon><Delete /></el-icon>
            删除
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

          <!-- 项目回顾 -->
          <el-card v-if="project.status === 'Completed'" class="retrospective-card">
            <template #header>
              <span>📝 项目回顾</span>
            </template>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="retrospective-section">
                  <h4>✅ 做得好的地方</h4>
                  <p v-if="project.retrospective_good">{{ project.retrospective_good }}</p>
                  <p v-else class="empty-text">暂无内容</p>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="retrospective-section">
                  <h4>🔧 需要改进的地方</h4>
                  <p v-if="project.retrospective_improve">{{ project.retrospective_improve }}</p>
                  <p v-else class="empty-text">暂无内容</p>
                </div>
              </el-col>
            </el-row>
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
                <span class="stat-value">{{ project.task_count }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">已完成</span>
                <span class="stat-value completed">{{ project.completed_task_count }}</span>
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

      <!-- 任务列表 -->
      <el-card class="tasks-card">
        <template #header>
          <div class="card-header-with-actions">
            <span>📋 任务列表</span>
            <el-button type="primary" size="small" @click="showAddTaskDialog">
              <el-icon><Plus /></el-icon>
              添加任务
            </el-button>
          </div>
        </template>

        <div class="tasks-list">
          <div v-if="tasks.length === 0" class="empty-tasks">
            <el-empty description="暂无任务" />
          </div>

          <div v-else class="task-items">
            <div
              v-for="task in tasks"
              :key="task.id"
              :class="['task-item', { completed: task.is_completed }]"
            >
              <el-checkbox
                v-model="task.is_completed"
                @change="toggleTask(task)"
              >
                <span class="task-content">{{ task.content }}</span>
              </el-checkbox>
              <el-button
                type="danger"
                text
                size="small"
                @click="deleteTask(task.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 时间线 -->
      <el-card v-if="timelineEvents.length > 0" class="timeline-card">
        <template #header>
          <span>📅 项目时间线</span>
        </template>

        <el-timeline>
          <el-timeline-item
            v-for="event in timelineEvents"
            :key="event.id"
            :timestamp="formatDateTime(event.created_at)"
            placement="top"
          >
            <card>{{ event.comment }}</card>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>

    <!-- 编辑项目对话框 -->
    <ProjectEditDialog
      v-model="editDialogVisible"
      :project="project"
      @project-updated="handleProjectUpdated"
    />

    <!-- 添加任务对话框 -->
    <el-dialog v-model="addTaskDialogVisible" title="添加任务" width="500px">
      <el-form @submit.prevent="addTask">
        <el-form-item label="任务内容" prop="content">
          <el-input
            v-model="newTaskContent"
            type="textarea"
            :rows="3"
            placeholder="请输入任务内容"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addTaskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addTask" :disabled="!newTaskContent.trim()">
          添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import AIChatPanel from '@/components/AIChatPanel.vue'
import ProjectEditDialog from '@/components/ProjectEditDialog.vue'
import type { Project, Task, TimelineEvent } from '@/types'

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
const tasks = ref<Task[]>([])
const timelineEvents = ref<TimelineEvent[]>([])
const editDialogVisible = ref(false)
const addTaskDialogVisible = ref(false)
const newTaskContent = ref('')

// 计算属性
const completionRate = computed(() => {
  if (!project.value || project.value.task_count === 0) return 0
  return Math.round((project.value.completed_task_count / project.value.task_count) * 100)
})

// 获取项目详情
const loadProject = async () => {
  if (!projectId.value) return

  loading.value = true
  error.value = ''

  try {
    const result = await projectStore.fetchProject(projectId.value)
    if (result.success && result.data) {
      project.value = result.data
      tasks.value = result.data.tasks || []
      // 获取时间线事件
      await loadTimelineEvents()
    } else {
      error.value = result.error || '加载项目失败'
    }
  } catch (err) {
    error.value = '加载项目时发生错误'
    console.error('加载项目失败:', err)
  } finally {
    loading.value = false
  }
}

// 获取时间线事件
const loadTimelineEvents = async () => {
  try {
    const result = await projectStore.fetchTimelineEvents(projectId.value)
    if (result.success) {
      timelineEvents.value = result.data || []
    }
  } catch (err) {
    console.error('加载时间线失败:', err)
  }
}

// 显示编辑对话框
const showEditDialog = () => {
  editDialogVisible.value = true
}

// 显示添加任务对话框
const showAddTaskDialog = () => {
  newTaskContent.value = ''
  addTaskDialogVisible.value = true
}

// 添加任务
const addTask = async () => {
  if (!newTaskContent.value.trim()) return

  try {
    const result = await projectStore.addTask(projectId.value, newTaskContent.value.trim())
    if (result.success && result.data) {
      tasks.value.push(result.data)
      // 更新项目统计
      if (project.value) {
        project.value.task_count++
      }
      addTaskDialogVisible.value = false
      ElMessage.success('任务添加成功')
    } else {
      ElMessage.error(result.error || '添加任务失败')
    }
  } catch (err) {
    ElMessage.error('添加任务失败')
    console.error('添加任务失败:', err)
  }
}

// 切换任务状态
const toggleTask = async (task: Task) => {
  try {
    const result = await projectStore.toggleTask(task.id, task.is_completed)
    if (result.success) {
      // 更新项目统计
      if (project.value) {
        if (task.is_completed) {
          project.value.completed_task_count++
        } else {
          project.value.completed_task_count--
        }
      }
      ElMessage.success(task.is_completed ? '任务已完成' : '任务已标记为未完成')
    } else {
      // 恢复状态
      task.is_completed = !task.is_completed
      ElMessage.error(result.error || '更新任务状态失败')
    }
  } catch (err) {
    // 恢复状态
    task.is_completed = !task.is_completed
    ElMessage.error('更新任务状态失败')
    console.error('更新任务状态失败:', err)
  }
}

// 删除任务
const deleteTask = async (taskId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个任务吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const result = await projectStore.deleteTask(taskId)
    if (result.success) {
      tasks.value = tasks.value.filter(task => task.id !== taskId)
      // 更新项目统计
      if (project.value) {
        project.value.task_count--
        if (tasks.value.find(t => t.id === taskId)?.is_completed) {
          project.value.completed_task_count--
        }
      }
      ElMessage.success('任务删除成功')
    } else {
      ElMessage.error(result.error || '删除任务失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除任务失败')
      console.error('删除任务失败:', err)
    }
  }
}

// 切换项目状态
const toggleProjectStatus = async () => {
  if (!project.value) return

  const isCompleting = project.value.status !== 'Completed'
  const actionText = isCompleting ? '完成' : '重新开启'

  try {
    await ElMessageBox.confirm(
      `确定要将项目标记为${actionText}吗？`,
      `确认${actionText}`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await projectStore.toggleProjectStatus(project.value.id, isCompleting)
    if (result.success) {
      project.value.status = isCompleting ? 'Completed' : 'InProgress'
      ElMessage.success(`项目已标记为${actionText}`)
    } else {
      ElMessage.error(result.error || `标记${actionText}失败`)
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(`标记${actionText}失败`)
      console.error(`标记${actionText}失败:`, err)
    }
  }
}

// 删除项目
const deleteProject = async () => {
  if (!project.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除项目"${project.value.title}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    const result = await projectStore.deleteProject(project.value.id)
    if (result.success) {
      ElMessage.success('项目删除成功')
      router.push('/projects')
    } else {
      ElMessage.error(result.error || '删除项目失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除项目失败')
      console.error('删除项目失败:', err)
    }
  }
}

// 项目更新处理
const handleProjectUpdated = (updatedProject: Project) => {
  project.value = updatedProject
  ElMessage.success('项目更新成功')
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
.stats-card,
.tasks-card,
.timeline-card,
.retrospective-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-with-actions {
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

.tasks-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-tasks {
  padding: 40px 0;
  text-align: center;
}

.task-items {
  padding: 10px 0;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f2f5;
  transition: background-color 0.2s;
}

.task-item:hover {
  background-color: #f5f7fa;
}

.task-item.completed {
  opacity: 0.7;
}

.task-item.completed .task-content {
  text-decoration: line-through;
  color: #909399;
}

.task-content {
  flex: 1;
  margin-left: 12px;
  font-size: 14px;
  color: #303133;
}

.retrospective-section {
  padding: 16px;
}

.retrospective-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
}

.retrospective-section p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
}

.empty-text {
  color: #909399;
  font-style: italic;
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