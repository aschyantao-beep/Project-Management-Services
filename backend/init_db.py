from app import create_app, db
from models import Project, Task, TimelineEvent, ProjectTemplate
from datetime import datetime, timedelta
import json

def init_sample_data():
    """初始化示例数据"""
    app = create_app()
    
    with app.app_context():
        # 检查是否已有数据
        if Project.query.count() > 0:
            print("数据库中已有数据，跳过初始化")
            return
        
        # 示例项目1: 网站重构
        project1 = Project(
            title="个人博客网站重构",
            goal="使用Vue.js重构现有博客，提升用户体验和性能",
            manager="我自己",
            participants="我自己",
            status='InProgress',
            priority='High',
            start_date=datetime.now().date() - timedelta(days=7),
            end_date=datetime.now().date() + timedelta(days=21)
        )
        
        # 示例项目2: 学习计划
        project2 = Project(
            title="Python进阶学习计划",
            goal="系统学习Python高级特性，包括装饰器、生成器、异步编程等",
            manager="我自己",
            participants="我自己",
            status='Planning',
            priority='Medium',
            start_date=datetime.now().date() + timedelta(days=3),
            end_date=datetime.now().date() + timedelta(days=30)
        )
        
        db.session.add_all([project1, project2])
        db.session.flush()
        
        # 为项目1添加任务
        tasks1 = [
            Task(project_id=project1.id, content="完成技术选型和架构设计", is_completed=True),
            Task(project_id=project1.id, content="搭建基础项目结构", is_completed=True),
            Task(project_id=project1.id, content="实现核心功能模块", is_completed=False),
            Task(project_id=project1.id, content="编写单元测试", is_completed=False),
            Task(project_id=project1.id, content="部署到生产环境", is_completed=False)
        ]
        
        # 为项目2添加任务
        tasks2 = [
            Task(project_id=project2.id, content="制定学习计划表", is_completed=False),
            Task(project_id=project2.id, content="学习装饰器和高阶函数", is_completed=False),
            Task(project_id=project2.id, content="掌握生成器和迭代器", is_completed=False),
            Task(project_id=project2.id, content="学习异步编程", is_completed=False),
            Task(project_id=project2.id, content="完成实践项目", is_completed=False)
        ]
        
        # 添加时间线事件
        timeline_events = [
            TimelineEvent(project_id=project1.id, comment="项目启动，开始技术调研"),
            TimelineEvent(project_id=project1.id, comment="确定了Vue.js + Flask的技术栈"),
            TimelineEvent(project_id=project2.id, comment="收集学习资料，制定学习路线")
        ]
        
        db.session.add_all(tasks1 + tasks2 + timeline_events)
        
        # 创建默认模板
        template1 = ProjectTemplate(
            name="网站开发项目",
            title_template="新网站开发项目",
            goal_template="开发一个现代化的网站，提供优秀的用户体验",
            default_tasks=json.dumps([
                "需求分析和技术选型",
                "UI/UX设计",
                "前端开发",
                "后端开发",
                "测试和调试",
                "部署上线"
            ])
        )
        
        template2 = ProjectTemplate(
            name="学习计划项目",
            title_template="技能学习计划",
            goal_template="系统学习新技能，提升个人能力",
            default_tasks=json.dumps([
                "制定学习计划",
                "收集学习资源",
                "理论基础学习",
                "实践练习",
                "项目实战",
                "总结和分享"
            ])
        )
        
        db.session.add_all([template1, template2])
        db.session.commit()
        
        print("示例数据和模板初始化完成！")
        print(f"创建了 {Project.query.count()} 个项目")
        print(f"创建了 {Task.query.count()} 个任务")
        print(f"创建了 {ProjectTemplate.query.count()} 个模板")

if __name__ == "__main__":
    init_sample_data()