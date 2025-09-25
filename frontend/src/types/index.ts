// 项目状态枚举
export enum ProjectStatus {
  PLANNING = 'Planning',
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
  ON_HOLD = 'OnHold'
}

// 优先级枚举
export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

// 项目接口
export interface Project {
  id: number
  title: string
  goal: string
  manager: string
  participants: string
  status: ProjectStatus
  priority: Priority
  start_date: string | null
  end_date: string | null
  retrospective_good: string
  retrospective_improve: string
  created_at: string
  updated_at: string
  task_count?: number
  completed_task_count?: number
  tasks?: Task[]
  timeline_events?: TimelineEvent[]
}

// 任务接口
export interface Task {
  id: number
  project_id: number
  content: string
  is_completed: boolean
  created_at: string
}

// 时间线事件接口
export interface TimelineEvent {
  id: number
  project_id: number
  comment: string
  created_at: string
}

// 项目模板接口
export interface ProjectTemplate {
  id: number
  name: string
  title_template: string
  goal_template: string
  default_tasks: string
  created_at: string
}

// API响应接口
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  count?: number
}

// 统计数据接口
export interface Statistics {
  overview: {
    total_projects: number
    active_projects: number
    completed_projects: number
    completion_rate: number
  }
  status_distribution: Array<{ name: string; value: number }>
  priority_distribution: Array<{ name: string; value: number }>
  monthly_trend: Array<{ month: string; completed: number; created: number }>
}

// 项目统计数据接口
export interface ProjectStatistics {
  task_completion_rate: number
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  timeline_events_count: number
  project_duration_days: number | null
  days_since_created: number
}