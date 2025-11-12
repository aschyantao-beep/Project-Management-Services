/**
 * 项目管理大师 - Supabase 初始化脚本
 * 在浏览器控制台中运行此脚本来快速设置 Supabase
 */

const initSupabase = async () => {
    console.log('🚀 项目管理大师 - Supabase 初始化工具');
    console.log('==========================================\n');

    // 步骤1：获取用户输入
    const supabaseUrl = prompt('请输入你的 Supabase URL (例如: https://xxx.supabase.co):');
    if (!supabaseUrl) {
        console.log('❌ 初始化已取消');
        return;
    }

    const supabaseKey = prompt('请输入你的 Supabase Anon Key:');
    if (!supabaseKey) {
        console.log('❌ 初始化已取消');
        return;
    }

    console.log('📝 正在验证 Supabase 连接...');

    try {
        // 验证连接
        const response = await fetch(`${supabaseUrl}/rest/v1/app_config?select=instance_name&limit=1`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`连接失败: ${response.status} ${response.statusText}`);
        }

        console.log('✅ Supabase 连接验证成功！');

        // 步骤2：保存到 localStorage
        localStorage.setItem('supabase_url', supabaseUrl);
        localStorage.setItem('supabase_anon_key', supabaseKey);
        console.log('💾 配置已保存到本地存储');

        // 步骤3：显示下一步操作
        console.log('\n📋 接下来你需要完成的步骤:');
        console.log('1. 访问 https://supabase.com/dashboard/project/_/sql');
        console.log('2. 复制并运行 supabase/setup.sql 中的SQL代码');
        console.log('3. 复制并运行 supabase/rls_policies.sql 中的SQL代码');
        console.log('4. 刷新页面以应用新配置');
        console.log('5. 开始使用项目管理大师！');

        // 步骤4：提供便捷的SQL复制功能
        console.log('\n📋 SQL 脚本内容已准备好，点击下方链接复制:');

        // 创建复制按钮功能
        const copyToClipboard = (text) => {
            navigator.clipboard.writeText(text).then(() => {
                console.log('✅ SQL 代码已复制到剪贴板！');
            }).catch(() => {
                console.log('❌ 复制失败，请手动复制');
            });
        };

        // 在控制台中提供复制函数
        window.copySetupSQL = () => {
            const setupSQL = `
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

SELECT '项目管理大师数据库设置完成！' AS status;`;
            copyToClipboard(setupSQL);
        };

        window.copyRLSSQL = () => {
            const rlsSQL = `
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

SELECT 'RLS 策略和辅助函数设置完成！' AS status;`;
            copyToClipboard(rlsSQL);
        };

        console.log('\n🔗 复制SQL脚本到剪贴板:');
        console.log('copySetupSQL()  - 复制数据库设置脚本');
        console.log('copyRLSSQL()    - 复制安全策略脚本');

        console.log('\n🎉 初始化完成！现在可以刷新页面开始使用。');

    } catch (error) {
        console.error('❌ Supabase 连接验证失败:', error.message);
        console.log('\n🔧 请检查以下内容:');
        console.log('1. Supabase URL 是否正确');
        console.log('2. Anon Key 是否正确');
        console.log('3. Supabase 项目是否已创建并激活');
        console.log('4. 是否已在项目中运行了数据库设置脚本');
    }
};

// 在控制台中提供便捷的初始化函数
window.initSupabase = initSupabase;

console.log('💡 使用方法: 在控制台中运行 initSupabase() 开始配置');