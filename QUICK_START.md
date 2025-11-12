# 🚀 快速开始指南

## ⚡ 一分钟部署你的项目管理应用

### 第一步：创建 Supabase 项目（2分钟）

1. 📝 [注册 Supabase](https://supabase.com)（免费）
2. ➕ 点击 "New Project" 创建新项目
3. 🏷️ 输入项目名称，选择地区
4. ⏳ 等待项目创建完成（约1分钟）

### 第二步：设置数据库（30秒）

1. 🗂️ 在 Supabase 控制台中点击 "SQL Editor"
2. 📋 复制以下代码并粘贴到编辑器：

```sql
-- 创建基础表结构
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    goal TEXT,
    manager VARCHAR(200),
    participants TEXT,
    status VARCHAR(20) DEFAULT 'Planning',
    priority VARCHAR(20) DEFAULT 'Medium',
    start_date DATE,
    end_date DATE,
    retrospective_good TEXT,
    retrospective_improve TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入示例数据
INSERT INTO projects (title, goal, manager, status, priority) VALUES
('我的第一个项目', '测试项目管理功能', '项目管理员', 'InProgress', 'High')
ON CONFLICT DO NOTHING;
```

3. ▶️ 点击 "RUN" 执行

### 第三步：获取 API 密钥（10秒）

1. ⚙️ 在 Supabase 控制台点击 "Project Settings"
2. 🔑 点击 "API" 标签
3. 📋 复制以下两个值：
   - **Project URL**（类似 `https://xxx.supabase.co`）
   - **Anon/public key**（以 `eyJ...` 开头）

### 第四步：部署到 Vercel（1分钟）

1. 🚀 [点击这里一键部署](https://vercel.com/new/clone?repository-url=https://github.com/your-username/project-manager)
2. 📝 在 Vercel 中填写：
   - **VITE_SUPABASE_URL**: 粘贴你的 Project URL
   - **VITE_SUPABASE_ANON_KEY**: 粘贴你的 Anon Key
3. ✅ 点击 "Deploy"

### 第五步：开始使用！🎉

部署完成后：
- 🌐 访问 Vercel 提供的网址
- 📱 立即开始管理你的项目
- 🔄 数据自动保存，永不丢失

---

## 🆘 遇到问题？

### ❓ 常见问题

**Q: 点击部署按钮提示仓库不存在？**
A: 请先 Fork 本仓库到你的 GitHub 账号

**Q: 部署后显示"需要配置数据库"？**
A: 检查 Vercel 中的环境变量是否正确设置

**Q: Supabase 连接失败？**
A: 确认 SQL 脚本已成功执行，API 密钥正确复制

**Q: 忘记保存 API 密钥？**
A: 在 Supabase 项目设置中重新生成密钥

### 💬 获取帮助

- 📖 查看完整文档：[README.md](README.md)
- 🐛 报告问题：[GitHub Issues](https://github.com/your-username/project-manager/issues)
- 💡 功能建议：[GitHub Discussions](https://github.com/your-username/project-manager/discussions)

---

## 🎯 快速测试应用功能

部署成功后，你可以：

1. ✨ **创建项目** - 点击"创建新项目"按钮
2. 📝 **添加任务** - 为项目添加具体任务
3. 📊 **查看统计** - 观察项目完成进度
4. 🎨 **自定义配置** - 修改应用名称和颜色

---

## 📱 移动端使用

应用完全支持移动设备：
- 📲 手机浏览器直接访问
- 📱 响应式设计，完美适配
- 👆 触摸友好的交互

---

**🎉 恭喜！你现在拥有了自己的项目管理工具！**

需要更多功能？[查看完整文档](README.md) 了解所有高级特性。