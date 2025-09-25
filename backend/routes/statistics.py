from flask import Blueprint, jsonify
from models import db, Project, Task
from sqlalchemy import func, extract
from datetime import datetime, timedelta

statistics_bp = Blueprint('statistics', __name__)

@statistics_bp.route('/projects/statistics', methods=['GET'])
def get_statistics():
    """获取项目统计数据"""
    try:
        # 项目状态统计
        status_stats = db.session.query(
            Project.status,
            func.count(Project.id)
        ).group_by(Project.status).all()
        
        status_data = []
        for status, count in status_stats:
            status_data.append({
                'name': status,
                'value': count
            })
        
        # 优先级统计
        priority_stats = db.session.query(
            Project.priority,
            func.count(Project.id)
        ).group_by(Project.priority).all()
        
        priority_data = []
        for priority, count in priority_stats:
            priority_data.append({
                'name': priority,
                'value': count
            })
        
        # 月度完成情况统计（最近6个月）
        monthly_stats = []
        current_date = datetime.now()
        
        for i in range(6):
            month_date = current_date - timedelta(days=30*i)
            month = month_date.month
            year = month_date.year
            
            # 获取该月完成的项目数
            completed_count = db.session.query(func.count(Project.id)).filter(
                extract('month', Project.updated_at) == month,
                extract('year', Project.updated_at) == year,
                Project.status == 'Completed'
            ).scalar() or 0
            
            # 获取该月创建的项目数
            created_count = db.session.query(func.count(Project.id)).filter(
                extract('month', Project.created_at) == month,
                extract('year', Project.created_at) == year
            ).scalar() or 0
            
            monthly_stats.append({
                'month': f"{year}-{month:02d}",
                'completed': completed_count,
                'created': created_count
            })
        
        monthly_stats.reverse()  # 按时间顺序排列
        
        # 任务完成率统计
        total_tasks = db.session.query(func.count(Task.id)).scalar() or 0
        completed_tasks = db.session.query(func.count(Task.id)).filter(
            Task.is_completed == True
        ).scalar() or 0
        
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # 总体统计
        total_projects = Project.query.count()
        active_projects = Project.query.filter(
            Project.status.in_(['Planning', 'InProgress'])
        ).count()
        completed_projects = Project.query.filter_by(
            status='Completed'
        ).count()
        
        return jsonify({
            'success': True,
            'data': {
                'overview': {
                    'total_projects': total_projects,
                    'active_projects': active_projects,
                    'completed_projects': completed_projects,
                    'completion_rate': round(completion_rate, 2)
                },
                'status_distribution': status_data,
                'priority_distribution': priority_data,
                'monthly_trend': monthly_stats
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/projects/<int:project_id>/statistics', methods=['GET'])
def get_project_statistics(project_id):
    """获取单个项目的统计数据"""
    try:
        project = Project.query.get_or_404(project_id)
        
        # 任务统计
        total_tasks = len(project.tasks)
        completed_tasks = len([t for t in project.tasks if t.is_completed])
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # 时间线事件数量
        timeline_count = len(project.timeline_events)
        
        # 项目持续时间
        duration_days = None
        if project.start_date and project.end_date:
            duration_days = (project.end_date - project.start_date).days
        
        return jsonify({
            'success': True,
            'data': {
                'task_completion_rate': round(completion_rate, 2),
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'pending_tasks': total_tasks - completed_tasks,
                'timeline_events_count': timeline_count,
                'project_duration_days': duration_days,
                'days_since_created': (datetime.now() - project.created_at).days
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500