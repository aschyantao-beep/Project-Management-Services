<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <!-- 搜索框 -->
      <el-col :span="24">
        <el-card class="search-card">
          <el-input
            v-model="searchQuery"
            placeholder="搜索项目名称..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-card>
      </el-col>

      <!-- 最新项目 -->
      <el-col :span="12">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>最新项目</span>
              <el-button type="primary" text @click="$router.push('/projects')">
                查看全部
              </el-button>
            </div>
          </template>
          <div v-if="latestProjects.length > 0" class="project-list">
            <div
              v-for="project in latestProjects"
              :key="project.id"
              class="project-item"
              @click="$router.push(`/projects/${project.id}`)"
            >
              <div class="project-info">
                <h4>{{ project.title }}</h4>
                <p>{{ project.goal }}</p>
                <div class="project-meta">
                  <el-tag :type="getPriorityType(project.priority)" size="small">
                    {{ getPriorityText(project.priority) }}
                  </el-tag>
                  <el-tag :type="getStatusType(project.status)" size="small">
                    {{ getStatusText(project.status) }}
                  </el-tag>
                  <span class="date">{{ formatDate(project.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无项目" />
        </el-card>
      </el-col>

      <!-- 项目统计 -->
      <el-col :span="12">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>项目统计</span>
              <el-button type="primary" text @click="handleExport">
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>
            </div>
          </template>
          <div class="statistics-grid">
            <div class="stat-item">
              <div class="stat-value">{{ inProgressProjects.length }}</div>
              <div class="stat-label">进行中</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ completedProjects.length }}</div>
              <div class="stat-label">已完成</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ projects.length }}</div>
              <div class="stat-label">总项目</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 进度统计图表 -->
      <el-col :span="24">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>项目进度统计</span>
              <el-button type="primary" text @click="refreshStatistics">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <div v-if="statistics" class="charts-container">
            <div class="chart-item">
              <h4>状态分布</h4>
              <div ref="statusChart" class="chart"></div>
            </div>
            <div class="chart-item">
              <h4>优先级分布</h4>
              <div ref="priorityChart" class="chart"></div>
            </div>
            <div class="chart-item">
              <h4>月度趋势</h4>
              <div ref="trendChart" class="chart"></div>
            </div>
          </div>
          <el-empty v-else description="暂无统计数据" />
        </el-card>
      </el-col>

      <!-- 迷你日历 -->
      <el-col :span="24">
        <el-card class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span>项目日历</span>
              <el-button type="primary" text @click="$router.push('/calendar')">
                查看完整日历
              </el-button>
            </div>
          </template>
          <el-calendar v-model="calendarDate" class="mini-calendar">
            <template #date-cell="{ data }">
              <div :class="getDateClass(data)">
                {{ data.day.split('-')[2] }}
              </div>
            </template>
          </el-calendar>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新建项目按钮 -->
    <el-button
      type="primary"
      size="large"
      circle
      class="fab-button"
      @click="showNewProjectDialog = true"
    >
      <el-icon><Plus /></el-icon>
    </el-button>

    <!-- 新建项目对话框 -->
    <NewProjectModal
      v-model="showNewProjectDialog"
      @created="handleProjectCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus, Download } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import NewProjectModal from '@/components/NewProjectModal.vue'
import * as echarts from 'echarts'
import { formatDate } from '@/utils/date'

const router = useRouter()
const projectStore = useProjectStore()

// 响应式数据
const searchQuery = ref('')
const calendarDate = ref(new Date())
const showNewProjectDialog = ref(false)
const statusChart = ref<HTMLElement>()
const priorityChart = ref<HTMLElement>()
const trendChart = ref<HTMLElement>()

// 计算属性
const projects = computed(() => projectStore.projects)
const inProgressProjects = computed(() => projectStore.inProgressProjects)
const completedProjects = computed(() => projectStore.completedProjects)
const latestProjects = computed(() => projectStore.latestProjects)
const statistics = computed(() => projectStore.statistics)

// 方法
const handleSearch = () => {
  projectStore.setSearchQuery(searchQuery.value)
  projectStore.fetchProjects()
}

const handleProjectCreated = () => {
  ElMessage.success('项目创建成功')
  projectStore.fetchProjects()
  projectStore.fetchStatistics()
}

const refreshStatistics = () => {
  projectStore.fetchStatistics()
}

const handleExport = async () => {
  const result = await projectStore.exportData()
  if (result.success) {
    ElMessage.success('数据导出成功')
  }
}

const getPriorityType = (priority: string) => {
  const types = {
    'High': 'danger',
    'Medium': 'warning',
    'Low': 'info'
  }
  return types[priority as keyof typeof types] || 'info'
}

const getPriorityText = (priority: string) => {
  const texts = {
    'High': '高',
    'Medium': '中',
    'Low': '低'
  }
  return texts[priority as keyof typeof texts] || priority
}

const getStatusType = (status: string) => {
  const types = {
    'Planning': 'info',
    'InProgress': 'primary',
    'Completed': 'success',
    'OnHold': 'warning'
  }
  return types[status as keyof typeof types] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    'Planning': '规划中',
    'InProgress': '进行中',
    'Completed': '已完成',
    'OnHold': '已搁置'
  }
  return texts[status as keyof typeof texts] || status
}

const getDateClass = (data: any) => {
  const date = data.day
  const hasProject = projects.value.some(p => 
    p.start_date === date || p.end_date === date
  )
  return {
    'date-cell': true,
    'has-project': hasProject
  }
}

// 初始化图表
const initCharts = () => {
  if (!statistics.value) return

  nextTick(() => {
    // 状态分布饼图
    if (statusChart.value) {
      const chart = echarts.init(statusChart.value)
      chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: statistics.value?.status_distribution || [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      })
    }

    // 优先级分布饼图
    if (priorityChart.value) {
      const chart = echarts.init(priorityChart.value)
      chart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: statistics.value?.priority_distribution || [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      })
    }

    // 月度趋势柱状图
    if (trendChart.value) {
      const chart = echarts.init(trendChart.value)
      const xAxisData = statistics.value?.monthly_trend.map(item => item.month) || []
      const completedData = statistics.value?.monthly_trend.map(item => item.completed) || []
      const createdData = statistics.value?.monthly_trend.map(item => item.created) || []
      
      chart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['完成', '创建']
        },
        xAxis: {
          type: 'category',
          data: xAxisData
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '完成',
            type: 'bar',
            data: completedData,
            itemStyle: {
              color: '#67c23a'
            }
          },
          {
            name: '创建',
            type: 'bar',
            data: createdData,
            itemStyle: {
              color: '#409eff'
            }
          }
        ]
      })
    }
  })
}

// 生命周期
onMounted(async () => {
  await projectStore.fetchProjects()
  await projectStore.fetchStatistics()
  initCharts()
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.search-card {
  margin-bottom: 20px;
}

.dashboard-card {
  margin-bottom: 20px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-list {
  max-height: 400px;
  overflow-y: auto;
}

.project-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.3s;
}

.project-item:hover {
  background-color: #f5f7fa;
}

.project-item:last-child {
  border-bottom: none;
}

.project-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.project-info p {
  margin: 0 0 8px 0;
  color: #909399;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date {
  color: #909399;
  font-size: 12px;
  margin-left: auto;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  text-align: center;
}

.stat-item {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.chart-item {
  text-align: center;
}

.chart-item h4 {
  margin-bottom: 10px;
  color: #303133;
}

.chart {
  width: 100%;
  height: 200px;
}

.mini-calendar {
  width: 100%;
}

.date-cell {
  padding: 4px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.has-project {
  background-color: #409eff;
  color: white;
  border-radius: 4px;
}

.fab-button {
  position: fixed;
  right: 40px;
  bottom: 40px;
  width: 60px;
  height: 60px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>