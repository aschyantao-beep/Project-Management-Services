-- 项目管理大师 - RLS (Row Level Security) 策略设置
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 启用 RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- 2. 为 app_config 设置策略 - 允许所有人读取（公开应用配置）
DROP POLICY IF EXISTS "Allow public read access to app_config" ON app_config;
CREATE POLICY "Allow public read access to app_config" ON app_config
    FOR SELECT USING (true);

-- 允许更新应用配置（通过服务密钥）
DROP POLICY IF EXISTS "Allow service role to update app_config" ON app_config;
CREATE POLICY "Allow service role to update app_config" ON app_config
    FOR ALL USING (auth.role() = 'service_role');

-- 3. 为 project_templates 设置策略 - 允许所有人读取模板
DROP POLICY IF EXISTS "Allow public read access to project_templates" ON project_templates;
CREATE POLICY "Allow public read access to project_templates" ON project_templates
    FOR SELECT USING (true);

-- 允许服务角色管理模板
DROP POLICY IF EXISTS "Allow service role full access to project_templates" ON project_templates;
CREATE POLICY "Allow service role full access to project_templates" ON project_templates
    FOR ALL USING (auth.role() = 'service_role');

-- 4. 为 projects 设置策略 - 允许所有人读取（公开项目管理）
DROP POLICY IF EXISTS "Allow public read access to projects" ON projects;
CREATE POLICY "Allow public read access to projects" ON projects
    FOR SELECT USING (true);

-- 允许所有人创建项目（公开应用）
DROP POLICY IF EXISTS "Allow public insert access to projects" ON projects;
CREATE POLICY "Allow public insert access to projects" ON projects
    FOR INSERT WITH CHECK (true);

-- 允许所有人更新项目
DROP POLICY IF EXISTS "Allow public update access to projects" ON projects;
CREATE POLICY "Allow public update access to projects" ON projects
    FOR UPDATE USING (true);

-- 允许所有人删除项目
DROP POLICY IF EXISTS "Allow public delete access to projects" ON projects;
CREATE POLICY "Allow public delete access to projects" ON projects
    FOR DELETE USING (true);

-- 5. 为 tasks 设置策略 - 通过项目关联进行访问控制
DROP POLICY IF EXISTS "Allow public access to tasks via project" ON tasks;
CREATE POLICY "Allow public access to tasks via project" ON tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = tasks.project_id
        )
    );

-- 6. 为 timeline_events 设置策略 - 通过项目关联进行访问控制
DROP POLICY IF EXISTS "Allow public access to timeline_events via project" ON timeline_events;
CREATE POLICY "Allow public access to timeline_events via project" ON timeline_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = timeline_events.project_id
        )
    );

-- 7. 创建用于统计视图的函数（公开访问）
CREATE OR REPLACE FUNCTION get_project_statistics()
RETURNS TABLE (
    total_projects BIGINT,
    active_projects BIGINT,
    completed_projects BIGINT,
    total_tasks BIGINT,
    completed_tasks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_projects,
        COUNT(*) FILTER (WHERE status = 'InProgress')::BIGINT as active_projects,
        COUNT(*) FILTER (WHERE status = 'Completed')::BIGINT as completed_projects,
        (SELECT COUNT(*) FROM tasks)::BIGINT as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE is_completed = true)::BIGINT as completed_tasks
    FROM projects;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建便于前端使用的视图
CREATE OR REPLACE VIEW project_with_details AS
SELECT
    p.*,
    COUNT(t.id) as task_count,
    COUNT(t.id) FILTER (WHERE t.is_completed = true) as completed_task_count,
    COUNT(te.id) as timeline_event_count,
    CASE
        WHEN COUNT(t.id) = 0 THEN 0
        ELSE ROUND((COUNT(t.id) FILTER (WHERE t.is_completed = true)::FLOAT / COUNT(t.id)) * 100, 2)
    END as completion_percentage
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN timeline_events te ON p.id = te.project_id
GROUP BY p.id;

-- 为视图创建公开访问策略
DROP POLICY IF EXISTS "Allow public read access to project_with_details" ON project_with_details;
CREATE POLICY "Allow public read access to project_with_details" ON project_with_details
    FOR SELECT USING (true);

-- 9. 创建项目搜索函数
CREATE OR REPLACE FUNCTION search_projects(search_term TEXT)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    goal TEXT,
    manager VARCHAR(200),
    status VARCHAR(20),
    priority VARCHAR(20),
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.goal,
        p.manager,
        p.status,
        p.priority,
        p.created_at
    FROM projects p
    WHERE
        ILIKE(p.title, '%' || search_term || '%') OR
        ILIKE(p.goal, '%' || search_term || '%') OR
        ILIKE(p.manager, '%' || search_term || '%') OR
        ILIKE(p.participants, '%' || search_term || '%')
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完成提示
SELECT 'RLS 策略和辅助函数设置完成！' AS status;