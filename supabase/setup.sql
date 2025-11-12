-- 项目管理大师 - Supabase 数据库设置脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 创建项目表
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    goal TEXT,
    manager VARCHAR(200),
    participants TEXT,
    status VARCHAR(20) DEFAULT 'Planning' CHECK (status IN ('Planning', 'InProgress', 'Completed', 'OnHold')),
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    start_date DATE,
    end_date DATE,
    retrospective_good TEXT,
    retrospective_improve TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建任务表
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建时间线事件表
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建项目模板表
CREATE TABLE IF NOT EXISTS project_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    title_template VARCHAR(500),
    goal_template TEXT,
    default_tasks JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 创建应用配置表（用于用户自定义）
CREATE TABLE IF NOT EXISTS app_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    instance_name VARCHAR(100) DEFAULT '项目管理大师',
    description TEXT DEFAULT '基于Web的现代化项目管理工具',
    theme_colors JSONB DEFAULT '{"primary": "#007bff", "secondary": "#6c757d", "success": "#28a745", "danger": "#dc3545", "warning": "#ffc107", "info": "#17a2b8"}',
    logo_url TEXT,
    favicon_url TEXT,
    custom_css TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_timeline_events_project_id ON timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_created_at ON timeline_events(created_at);

-- 8. 创建触发器以自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. 插入默认应用配置
INSERT INTO app_config (instance_name, description)
VALUES ('项目管理大师', '基于Web的现代化项目管理工具')
ON CONFLICT DO NOTHING;

-- 10. 插入默认项目模板
INSERT INTO project_templates (name, title_template, goal_template, default_tasks)
VALUES
    (
        '网站开发项目',
        '新网站开发项目',
        '开发一个现代化的网站，提供优秀的用户体验',
        '["需求分析和技术选型", "UI/UX设计", "前端开发", "后端开发", "测试和调试", "部署上线"]'
    ),
    (
        '学习计划项目',
        '技能学习计划',
        '系统学习新技能，提升个人能力',
        '["制定学习计划", "收集学习资源", "理论基础学习", "实践练习", "项目实战", "总结和分享"]'
    ),
    (
        '移动应用开发',
        '移动应用开发项目',
        '开发一款实用的移动应用，解决用户痛点',
        '["市场调研", "功能规划", "原型设计", "UI设计", "开发实现", "测试优化", "发布上架"]'
    )
ON CONFLICT DO NOTHING;

-- 11. 插入示例项目数据（可选，新实例初始化时使用）
INSERT INTO projects (title, goal, manager, participants, status, priority, start_date, end_date)
VALUES
    (
        '个人博客网站重构',
        '使用Vue.js重构现有博客，提升用户体验和性能',
        '项目管理员',
        '前端开发、后端开发',
        'InProgress',
        'High',
        CURRENT_DATE - INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '21 days'
    ),
    (
        'Python进阶学习计划',
        '系统学习Python高级特性，包括装饰器、生成器、异步编程等',
        '学习者',
        '学习者',
        'Planning',
        'Medium',
        CURRENT_DATE + INTERVAL '3 days',
        CURRENT_DATE + INTERVAL '30 days'
    )
ON CONFLICT DO NOTHING;

-- 12. 为示例项目添加任务
INSERT INTO tasks (project_id, content, is_completed)
SELECT
    p.id,
    t.content,
    t.is_completed
FROM (VALUES
    ('个人博客网站重构', '完成技术选型和架构设计', true),
    ('个人博客网站重构', '搭建基础项目结构', true),
    ('个人博客网站重构', '实现核心功能模块', false),
    ('个人博客网站重构', '编写单元测试', false),
    ('个人博客网站重构', '部署到生产环境', false)
) AS t(project_title, content, is_completed)
JOIN projects p ON p.title = t.project_title
ON CONFLICT DO NOTHING;

INSERT INTO tasks (project_id, content, is_completed)
SELECT
    p.id,
    t.content,
    t.is_completed
FROM (VALUES
    ('Python进阶学习计划', '制定学习计划表', false),
    ('Python进阶学习计划', '学习装饰器和高阶函数', false),
    ('Python进阶学习计划', '掌握生成器和迭代器', false),
    ('Python进阶学习计划', '学习异步编程', false),
    ('Python进阶学习计划', '完成实践项目', false)
) AS t(project_title, content, is_completed)
JOIN projects p ON p.title = t.project_title
ON CONFLICT DO NOTHING;

-- 13. 添加时间线事件
INSERT INTO timeline_events (project_id, comment)
SELECT
    p.id,
    t.comment
FROM (VALUES
    ('个人博客网站重构', '项目启动，开始技术调研'),
    ('个人博客网站重构', '确定了Vue.js + Flask的技术栈'),
    ('Python进阶学习计划', '收集学习资料，制定学习路线')
) AS t(project_title, comment)
JOIN projects p ON p.title = t.project_title
ON CONFLICT DO NOTHING;

-- 完成提示
SELECT '项目管理大师数据库设置完成！' AS status;