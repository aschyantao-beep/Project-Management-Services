# 项目管理大师 - 本地使用说明

## 快速开始

### 方法1：使用启动器（推荐）
1. 确保后端服务已启动：
   - 运行 `backend/start.bat`
   - 或使用命令行：`cd backend && venv/Scripts/python run.py`

2. 打开启动器：
   - 双击 `frontend/dist/launcher.html`
   - 或 `frontend/dist/simple.html`

3. 等待状态显示为"后端服务正常运行"
4. 点击"启动应用"按钮

### 方法2：直接打开
1. 启动后端服务（同上）
2. 直接双击 `frontend/dist/index.html`

### 方法3：开发模式
1. 启动后端：`cd backend && venv/Scripts/python run.py`
2. 启动前端：`cd frontend && npm run dev`
3. 访问：http://localhost:3000

## 文件说明

### 关键文件
- `frontend/dist/index.html` - 主应用文件
- `frontend/dist/launcher.html` - 新启动器（推荐）
- `frontend/dist/simple.html` - 简单启动器
- `frontend/dist/debug.html` - 调试页面
- `backend/start.bat` - Windows一键启动脚本

### 构建文件
如果遇到资源加载错误，请重新构建前端：
```bash
cd frontend
npm run build
```

## 常见问题

### 白屏或空白页面
1. 检查浏览器控制台错误
2. 确认已运行 `npm run build` 构建前端
3. 尝试使用Chrome或Edge浏览器

### 数据无法加载
1. 确认后端服务已启动（端口5000）
2. 检查是否有防火墙阻止连接
3. 使用调试页面检查API连接

### 文件路径错误
1. 确保所有文件使用相对路径
2. 不要直接从压缩包运行，先解压
3. 使用启动器而不是直接打开index.html

## 浏览器要求
- Chrome 88+
- Edge 88+
- Firefox 85+
- Safari 14+

需要支持：ES Modules、Fetch API、LocalStorage、Promise