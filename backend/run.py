from app import create_app, db
from init_db import init_sample_data

if __name__ == '__main__':
    app = create_app()
    
    # 初始化示例数据
    print("正在初始化数据库...")
    init_sample_data()
    
    print("\n服务器启动成功！")
    print("API文档: http://localhost:5000")
    print("\n可用接口:")
    print("- GET    /api/projects          - 获取项目列表")
    print("- POST   /api/projects          - 创建新项目")
    print("- GET    /api/projects/{id}     - 获取项目详情")
    print("- PUT    /api/projects/{id}     - 更新项目")
    print("- DELETE /api/projects/{id}     - 删除项目")
    print("- PUT    /api/projects/{id}/complete - 标记项目完成")
    print("- GET    /api/projects/statistics - 获取统计数据")
    print("- GET    /api/export            - 导出数据")
    print("- GET    /api/templates         - 获取项目模板")
    
    app.run(debug=True, port=5000, host='0.0.0.0')