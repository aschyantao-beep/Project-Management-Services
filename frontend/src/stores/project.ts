import { defineStore } from 'pinia'
import request from '@/utils/request'
import type { Project, Task, TimelineEvent, ProjectTemplate, ApiResponse, Statistics, ProjectStatistics } from '@/types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  templates: ProjectTemplate[]
  statistics: Statistics | null
  loading: boolean
  searchQuery: string
  filterStatus: string
  filterPriority: string
  sortBy: string
  sortOrder: string
}

export const useProjectStore = defineStore('project', {
  state: (): ProjectState => ({
    projects: [],
    currentProject: null,
    templates: [],
    statistics: null,
    loading: false,
    searchQuery: '',
    filterStatus: '',
    filterPriority: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  }),

  getters: {
    filteredProjects: (state) => {
      let result = state.projects

      // 搜索过滤
      if (state.searchQuery) {
        result = result.filter(p => 
          p.title.toLowerCase().includes(state.searchQuery.toLowerCase())
        )
      }

      // 状态过滤
      if (state.filterStatus) {
        result = result.filter(p => p.status === state.filterStatus)
      }

      // 优先级过滤
      if (state.filterPriority) {
        result = result.filter(p => p.priority === state.filterPriority)
      }

      return result
    },

    inProgressProjects: (state) => {
      return state.projects.filter(p => p.status === 'InProgress')
    },

    completedProjects: (state) => {
      return state.projects.filter(p => p.status === 'Completed')
    },

    latestProjects: (state) => {
      return state.projects.slice(0, 10)
    }
  },

  actions: {
    // 获取项目列表
    async fetchProjects() {
      this.loading = true
      try {
        const params = new URLSearchParams()
        if (this.filterStatus) params.append('status', this.filterStatus)
        if (this.filterPriority) params.append('priority', this.filterPriority)
        if (this.searchQuery) params.append('search', this.searchQuery)
        params.append('sort', this.sortBy)
        params.append('order', this.sortOrder)

        const response = await request.get<ApiResponse<Project[]>>(`/projects?${params}`)
        if (response.data?.success) {
          this.projects = response.data.data || []
        }
      } catch (error) {
        console.error('获取项目列表失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 获取项目详情
    async fetchProject(id: number) {
      this.loading = true
      try {
        const response = await request.get<ApiResponse<Project>>(`/projects/${id}`)
        if (response.data?.success) {
          this.currentProject = response.data.data || null
        }
        return response
      } catch (error) {
        console.error('获取项目详情失败:', error)
        return { success: false, error: '获取项目详情失败' }
      } finally {
        this.loading = false
      }
    },

    // 创建项目
    async createProject(data: Partial<Project>) {
      try {
        const response = await request.post<ApiResponse<Project>>('/projects', data)
        if (response.data?.success && response.data.data) {
          this.projects.unshift(response.data.data)
        }
        return response
      } catch (error) {
        console.error('创建项目失败:', error)
        return { success: false, error: '创建项目失败' }
      }
    },

    // 更新项目
    async updateProject(id: number, data: Partial<Project>) {
      try {
        const response = await request.put<ApiResponse<Project>>(`/projects/${id}`, data)
        if (response.data?.success && response.data.data) {
          const index = this.projects.findIndex(p => p.id === id)
          if (index !== -1) {
            this.projects[index] = response.data.data
          }
          if (this.currentProject?.id === id) {
            this.currentProject = response.data.data
          }
        }
        return response
      } catch (error) {
        console.error('更新项目失败:', error)
        return { success: false, error: '更新项目失败' }
      }
    },

    // 删除项目
    async deleteProject(id: number) {
      try {
        const response = await request.delete<ApiResponse<Project>>(`/projects/${id}`)
        if (response.data?.success) {
          this.projects = this.projects.filter(p => p.id !== id)
          if (this.currentProject?.id === id) {
            this.currentProject = null
          }
        }
        return response
      } catch (error) {
        console.error('删除项目失败:', error)
        return { success: false, error: '删除项目失败' }
      }
    },

    // 标记项目完成
    async completeProject(id: number) {
      try {
        const response = await request.put<ApiResponse<Project>>(`/projects/${id}/complete`)
        if (response.data?.success && response.data.data) {
          const index = this.projects.findIndex(p => p.id === id)
          if (index !== -1) {
            this.projects[index] = response.data.data
          }
          if (this.currentProject?.id === id) {
            this.currentProject = response.data.data
          }
        }
        return response
      } catch (error) {
        console.error('标记项目完成失败:', error)
        return { success: false, error: '标记项目完成失败' }
      }
    },

    // 创建任务
    async createTask(projectId: number, content: string) {
      try {
        const response = await request.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, { content })
        if (response.data?.success && response.data.data && this.currentProject) {
          this.currentProject.tasks = this.currentProject.tasks || []
          this.currentProject.tasks.push(response.data.data)
        }
        return response
      } catch (error) {
        console.error('创建任务失败:', error)
        return { success: false, error: '创建任务失败' }
      }
    },

    // 更新任务状态
    async updateTask(taskId: number, isCompleted: boolean) {
      try {
        const response = await request.put<ApiResponse<Task>>(`/tasks/${taskId}`, { is_completed: isCompleted })
        if (response.data?.success && response.data.data && this.currentProject) {
          const task = this.currentProject.tasks?.find(t => t.id === taskId)
          if (task) {
            task.is_completed = isCompleted
          }
        }
        return response
      } catch (error) {
        console.error('更新任务失败:', error)
        return { success: false, error: '更新任务失败' }
      }
    },

    // 添加时间线事件
    async addTimelineEvent(projectId: number, comment: string) {
      try {
        const response = await request.post<ApiResponse<TimelineEvent>>(`/projects/${projectId}/timeline`, { comment })
        if (response.data?.success && response.data.data && this.currentProject) {
          this.currentProject.timeline_events = this.currentProject.timeline_events || []
          this.currentProject.timeline_events.unshift(response.data.data)
        }
        return response
      } catch (error) {
        console.error('添加动态失败:', error)
        return { success: false, error: '添加动态失败' }
      }
    },

    // 获取项目模板
    async fetchTemplates() {
      try {
        const response = await request.get<ApiResponse<ProjectTemplate[]>>('/templates')
        if (response.data?.success) {
          this.templates = response.data.data || []
        }
      } catch (error) {
        console.error('获取模板失败:', error)
      }
    },

    // 创建项目模板
    async createTemplate(data: Partial<ProjectTemplate>) {
      try {
        const response = await request.post<ApiResponse<ProjectTemplate>>('/templates', data)
        if (response.data?.success && response.data.data) {
          this.templates.unshift(response.data.data)
        }
        return response
      } catch (error) {
        console.error('创建模板失败:', error)
        return { success: false, error: '创建模板失败' }
      }
    },

    // 获取统计数据
    async fetchStatistics() {
      try {
        const response = await request.get<ApiResponse<Statistics>>('/projects/statistics')
        if (response.data?.success) {
          this.statistics = response.data.data || null
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    },

    // 导出数据
    async exportData() {
      try {
        const response = await request.get('/export', {
          responseType: 'blob'
        })
        
        // 创建下载链接
        const blob = new Blob([response.data])
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `project_export_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        return { success: true }
      } catch (error) {
        console.error('导出数据失败:', error)
        return { success: false, error: '导出数据失败' }
      }
    },

    // 设置搜索查询
    setSearchQuery(query: string) {
      this.searchQuery = query
    },

    // 设置筛选条件
    setFilters(status: string, priority: string) {
      this.filterStatus = status
      this.filterPriority = priority
    },

    // 设置排序
    setSort(sortBy: string, sortOrder: string) {
      this.sortBy = sortBy
      this.sortOrder = sortOrder
    }
  }
})