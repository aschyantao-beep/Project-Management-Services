# 项目管理大师 🚀

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/project-manager)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org)

> 🎯 **一键部署的现代化项目管理工具** - 支持多用户、完全免费、无需后端服务器

## ✨ 特性

- 🌟 **完全免费** - 基于 Supabase 和 Vercel，零成本部署
- 🚀 **一键部署** - 点击按钮即可拥有自己的项目管理应用
- 👥 **多用户支持** - 每个人都拥有独立的数据空间
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🎨 **赛博朋克风格** - 炫酷的UI设计和动画效果
- 📊 **数据统计** - 实时项目进度和任务统计
- 🔄 **实时同步** - 数据实时保存，永不丢失
- 🛠️ **项目模板** - 内置多种项目模板，快速开始

## 🎬 演示

[![项目管理大师演示](https://img.shields.io/badge/在线演示-点击查看-blue.svg)](https://your-demo-url.vercel.app)

## 🚀 快速开始

### 方法一：一键部署到 Vercel（推荐）

1. 点击上方 "Deploy with Vercel" 按钮
2. 在 Vercel 中设置环境变量：
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. 部署完成，开始使用！

### 方法二：手动部署

#### 前置要求

- Node.js 16+
- Git
- [Supabase 账号](https://supabase.com)（免费）

#### 步骤 1: Fork 本仓库

```bash
git clone https://github.com/your-username/project-manager.git
cd project-manager
```

#### 步骤 2: 设置 Supabase

1. 访问 [Supabase](https://supabase.com) 并创建新项目
2. 在项目的 SQL Editor 中运行以下脚本：

```sql
-- 复制 supabase/setup.sql 中的内容并执行
```

3. 继续运行 RLS 策略脚本：

```sql
-- 复制 supabase/rls_policies.sql 中的内容并执行
```

4. 在 Project Settings > API 中获取你的 URL 和 anon key

#### 步骤 3: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的 Supabase 信息
nano .env
```

#### 步骤 4: 部署到 Vercel

```bash
# 安装依赖
npm install

# 一键部署
npm run deploy
```

## 📋 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# Supabase 配置（必需）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 应用自定义（可选）
VITE_APP_NAME=项目管理大师
VITE_APP_DESCRIPTION=基于Web的现代化项目管理工具

# 主题颜色（可选）
VITE_PRIMARY_COLOR=#007bff
VITE_SECONDARY_COLOR=#6c757d
```

## 🎯 使用指南

### 首次配置

1. 打开部署后的应用地址
2. 如果看到配置提示，点击 "立即配置"
3. 输入你的 Supabase URL 和 Anon Key
4. 保存配置，开始使用

### 主要功能

#### 📁 项目管理
- 创建、编辑、删除项目
- 设置项目优先级和状态
- 项目进度跟踪
- 支持多种项目状态（规划中、进行中、已完成、暂停）

#### ✅ 任务管理
- 为项目添加任务
- 标记任务完成状态
- 任务进度统计
- 实时进度显示

#### 📊 数据统计
- 项目总数统计
- 进行中和已完成项目数量
- 任务完成率分析
- 可视化进度展示

#### 🎨 自定义配置
- 自定义应用名称和描述
- 配置主题颜色
- 设置 Logo 和品牌
- 自定义 CSS 样式

## 🛠️ 技术栈

- **前端框架**: Vue.js 3
- **UI 组件**: Element Plus
- **数据库**: Supabase (PostgreSQL)
- **部署平台**: Vercel
- **动画**: Framer Motion, Lottie
- **样式**: CSS3, 渐变效果

## 📁 项目结构

```
project-manager/
├── frontend/
│   ├── dist/                 # 构建输出
│   │   ├── supabase-enabled.html    # 主应用文件
│   │   ├── supabase-client.js       # Supabase 客户端封装
│   │   └── config.js               # 配置管理
│   └── src/                  # 源代码
├── supabase/
│   ├── setup.sql             # 数据库初始化脚本
│   └── rls_policies.sql      # 安全策略配置
├── scripts/
│   ├── init-supabase.js      # 初始化工具
│   └── deploy-vercel.js      # 部署脚本
├── vercel.json               # Vercel 配置
├── package.json              # 项目依赖
├── .env.example              # 环境变量模板
└── README.md                 # 项目文档
```

## 🔧 开发指南

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/your-username/project-manager.git
cd project-manager

# 安装依赖
npm run setup

# 启动开发服务器
npm run dev
```

### 配置开发环境

1. 创建 `.env.local` 文件：
```env
VITE_SUPABASE_URL=your_local_supabase_url
VITE_SUPABASE_ANON_KEY=your_local_supabase_key
```

2. 启动开发服务器，访问 `http://localhost:3000`

### 添加新功能

1. 修改 `frontend/src/` 中的源代码
2. 如需数据库更改，更新 `supabase/` 中的 SQL 脚本
3. 测试新功能
4. 提交 Pull Request

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

### v2.0.0 (2024-01-15)
- ✨ 全新的 Supabase 后端架构
- 🚀 一键部署功能
- 🎨 全新 UI 设计
- 📱 完全响应式布局
- 🔄 实时数据同步

### v1.0.0 (2024-01-01)
- 🎉 初始版本发布
- 📁 基础项目管理功能
- ✅ 任务管理系统
- 📊 数据统计功能

## ❓ 常见问题

### Q: 部署后看到 "需要配置数据库" 提示？
A: 这是因为环境变量没有正确设置。请确保在 Vercel 中正确设置了 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。

### Q: Supabase 连接失败怎么办？
A: 请检查：
1. Supabase 项目是否已创建并激活
2. 是否已运行数据库设置脚本
3. API 密钥是否正确
4. 网络连接是否正常

### Q: 数据会丢失吗？
A: 不会！所有数据都存储在 Supabase 中，即使重新部署也不会丢失。

### Q: 可以自定义应用名称和 Logo 吗？
A: 可以！通过修改环境变量或数据库中的 `app_config` 表来自定义。

### Q: 支持多人协作吗？
A: 当前版本是单用户模式。每个部署实例都有独立的数据空间。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 优秀的前端框架
- [Supabase](https://supabase.com/) - 神奇的 Backend-as-a-Service
- [Vercel](https://vercel.com/) - 优秀的部署平台
- [Element Plus](https://element-plus.org/) - 精美的 UI 组件库

## 📞 联系我们

- 🐛 **Bug 反馈**: [Issues](https://github.com/your-username/project-manager/issues)
- 💡 **功能建议**: [Discussions](https://github.com/your-username/project-manager/discussions)
- 📧 **邮件联系**: your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给我们一个 Star！

🎉 [立即部署你的项目管理大师](https://vercel.com/new/clone?repository-url=https://github.com/your-username/project-manager)