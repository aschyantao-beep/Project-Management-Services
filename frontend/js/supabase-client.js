/**
 * 项目管理大师 - Supabase 客户端封装
 * 提供所有数据库操作的统一接口
 */

class SupabaseProjectManager {
    constructor(supabaseUrl, supabaseAnonKey) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseAnonKey = supabaseAnonKey;
        this.client = null;
        this.initClient();
    }

    /**
     * 初始化 Supabase 客户端
     */
    async initClient() {
        try {
            // 动态加载 Supabase 客户端库
            if (!window.supabase) {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/@supabase/supabase-js@2';
                script.type = 'module';
                document.head.appendChild(script);

                // 等待库加载完成
                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }

            // 创建客户端实例
            const { createClient } = window.supabase;
            this.client = createClient(this.supabaseUrl, this.supabaseAnonKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });

            console.log('Supabase 客户端初始化成功');
            return true;
        } catch (error) {
            console.error('Supabase 客户端初始化失败:', error);
            this.showError('数据库连接失败，请检查配置');
            return false;
        }
    }

    /**
     * 错误处理
     */
    handleError(error, operation = '操作') {
        console.error(`${operation}失败:`, error);
        let message = `${operation}失败`;

        if (error.code === 'PGRST116') {
            message = '未找到相关数据';
        } else if (error.code === 'PGRST301') {
            message = '权限不足';
        } else if (error.message) {
            message = error.message;
        }

        this.showError(message);
        throw error;
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        // 这里可以集成到现有的错误显示系统
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * 显示成功消息
     */
    showSuccess(message) {
        if (window.showNotification) {
            window.showNotification(message, 'success');
        }
    }

    // ==================== 项目管理 ====================

    /**
     * 获取所有项目
     */
    async getProjects() {
        try {
            const { data, error } = await this.client
                .from('project_with_details')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            this.handleError(error, '获取项目列表');
            return [];
        }
    }

    /**
     * 根据ID获取项目详情
     */
    async getProject(projectId) {
        try {
            const { data, error } = await this.client
                .from('projects')
                .select(`
                    *,
                    tasks (*),
                    timeline_events (*)
                `)
                .eq('id', projectId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            this.handleError(error, '获取项目详情');
            return null;
        }
    }

    /**
     * 创建新项目
     */
    async createProject(projectData) {
        try {
            const { data, error } = await this.client
                .from('projects')
                .insert([{
                    title: projectData.title,
                    goal: projectData.goal,
                    manager: projectData.manager,
                    participants: projectData.participants,
                    status: projectData.status || 'Planning',
                    priority: projectData.priority || 'Medium',
                    start_date: projectData.start_date,
                    end_date: projectData.end_date
                }])
                .select()
                .single();

            if (error) throw error;
            this.showSuccess('项目创建成功！');
            return data;
        } catch (error) {
            this.handleError(error, '创建项目');
            return null;
        }
    }

    /**
     * 更新项目
     */
    async updateProject(projectId, updateData) {
        try {
            const { data, error } = await this.client
                .from('projects')
                .update({
                    title: updateData.title,
                    goal: updateData.goal,
                    manager: updateData.manager,
                    participants: updateData.participants,
                    status: updateData.status,
                    priority: updateData.priority,
                    start_date: updateData.start_date,
                    end_date: updateData.end_date,
                    retrospective_good: updateData.retrospective_good,
                    retrospective_improve: updateData.retrospective_improve
                })
                .eq('id', projectId)
                .select()
                .single();

            if (error) throw error;
            this.showSuccess('项目更新成功！');
            return data;
        } catch (error) {
            this.handleError(error, '更新项目');
            return null;
        }
    }

    /**
     * 删除项目
     */
    async deleteProject(projectId) {
        try {
            const { error } = await this.client
                .from('projects')
                .delete()
                .eq('id', projectId);

            if (error) throw error;
            this.showSuccess('项目删除成功！');
            return true;
        } catch (error) {
            this.handleError(error, '删除项目');
            return false;
        }
    }

    /**
     * 标记项目完成
     */
    async completeProject(projectId, retrospectiveData = {}) {
        try {
            const { data, error } = await this.client
                .from('projects')
                .update({
                    status: 'Completed',
                    end_date: new Date().toISOString().split('T')[0],
                    retrospective_good: retrospectiveData.good,
                    retrospective_improve: retrospectiveData.improve
                })
                .eq('id', projectId)
                .select()
                .single();

            if (error) throw error;
            this.showSuccess('项目已标记为完成！');
            return data;
        } catch (error) {
            this.handleError(error, '完成项目');
            return null;
        }
    }

    /**
     * 搜索项目
     */
    async searchProjects(searchTerm) {
        try {
            const { data, error } = await this.client
                .rpc('search_projects', { search_term: searchTerm });

            if (error) throw error;
            return data || [];
        } catch (error) {
            this.handleError(error, '搜索项目');
            return [];
        }
    }

    // ==================== 任务管理 ====================

    /**
     * 获取项目的所有任务
     */
    async getProjectTasks(projectId) {
        try {
            const { data, error } = await this.client
                .from('tasks')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            this.handleError(error, '获取任务列表');
            return [];
        }
    }

    /**
     * 创建任务
     */
    async createTask(projectId, content) {
        try {
            const { data, error } = await this.client
                .from('tasks')
                .insert([{
                    project_id: projectId,
                    content: content
                }])
                .select()
                .single();

            if (error) throw error;
            this.showSuccess('任务创建成功！');
            return data;
        } catch (error) {
            this.handleError(error, '创建任务');
            return null;
        }
    }

    /**
     * 更新任务状态
     */
    async updateTask(taskId, isCompleted) {
        try {
            const { data, error } = await this.client
                .from('tasks')
                .update({
                    is_completed: isCompleted
                })
                .eq('id', taskId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            this.handleError(error, '更新任务');
            return null;
        }
    }

    /**
     * 删除任务
     */
    async deleteTask(taskId) {
        try {
            const { error } = await this.client
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            this.showSuccess('任务删除成功！');
            return true;
        } catch (error) {
            this.handleError(error, '删除任务');
            return false;
        }
    }

    // ==================== 时间线管理 ====================

    /**
     * 获取项目时间线
     */
    async getProjectTimeline(projectId) {
        try {
            const { data, error } = await this.client
                .from('timeline_events')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            this.handleError(error, '获取时间线');
            return [];
        }
    }

    /**
     * 添加时间线事件
     */
    async addTimelineEvent(projectId, comment) {
        try {
            const { data, error } = await this.client
                .from('timeline_events')
                .insert([{
                    project_id: projectId,
                    comment: comment
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            this.handleError(error, '添加时间线事件');
            return null;
        }
    }

    // ==================== 模板管理 ====================

    /**
     * 获取所有项目模板
     */
    async getProjectTemplates() {
        try {
            const { data, error } = await this.client
                .from('project_templates')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            this.handleError(error, '获取项目模板');
            return [];
        }
    }

    /**
     * 根据模板创建项目
     */
    async createProjectFromTemplate(templateId, customData = {}) {
        try {
            // 获取模板
            const template = await this.getProjectTemplate(templateId);
            if (!template) return null;

            // 创建项目
            const project = await this.createProject({
                title: customData.title || template.title_template,
                goal: customData.goal || template.goal_template,
                manager: customData.manager,
                participants: customData.participants,
                status: customData.status || 'Planning',
                priority: customData.priority || 'Medium',
                start_date: customData.start_date,
                end_date: customData.end_date
            });

            if (project && template.default_tasks) {
                // 创建默认任务
                const tasks = Array.isArray(template.default_tasks)
                    ? template.default_tasks
                    : JSON.parse(template.default_tasks);

                for (const taskContent of tasks) {
                    await this.createTask(project.id, taskContent);
                }
            }

            return project;
        } catch (error) {
            this.handleError(error, '从模板创建项目');
            return null;
        }
    }

    /**
     * 获取单个模板
     */
    async getProjectTemplate(templateId) {
        try {
            const { data, error } = await this.client
                .from('project_templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            this.handleError(error, '获取项目模板');
            return null;
        }
    }

    // ==================== 统计数据 ====================

    /**
     * 获取项目统计信息
     */
    async getProjectStatistics() {
        try {
            const { data, error } = await this.client
                .rpc('get_project_statistics');

            if (error) throw error;
            return data[0] || {
                total_projects: 0,
                active_projects: 0,
                completed_projects: 0,
                total_tasks: 0,
                completed_tasks: 0
            };
        } catch (error) {
            this.handleError(error, '获取统计数据');
            return null;
        }
    }

    // ==================== 应用配置 ====================

    /**
     * 获取应用配置
     */
    async getAppConfig() {
        try {
            const { data, error } = await this.client
                .from('app_config')
                .select('*')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            // 如果没有配置，返回默认值
            return {
                instance_name: '项目管理大师',
                description: '基于Web的现代化项目管理工具',
                theme_colors: {
                    primary: "#007bff",
                    secondary: "#6c757d",
                    success: "#28a745",
                    danger: "#dc3545",
                    warning: "#ffc107",
                    info: "#17a2b8"
                }
            };
        }
    }

    /**
     * 测试连接
     */
    async testConnection() {
        try {
            const { data, error } = await this.client
                .from('app_config')
                .select('instance_name')
                .limit(1);

            if (error) throw error;
            console.log('Supabase 连接测试成功');
            return true;
        } catch (error) {
            console.error('Supabase 连接测试失败:', error);
            return false;
        }
    }
}

// 导出类
window.SupabaseProjectManager = SupabaseProjectManager;