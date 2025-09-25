from flask import Blueprint, request, jsonify
from models import db, Project, Task, TimelineEvent
from datetime import datetime
from sqlalchemy import or_, and_

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('', methods=['GET'])
def get_projects():
    """获取项目列表，支持筛选和搜索"""
    try:
        # 获取查询参数
        status = request.args.get('status')
        priority = request.args.get('priority')
        search = request.args.get('search')
        sort = request.args.get('sort', 'created_at')  # 默认按创建时间排序
        order = request.args.get('order', 'desc')  # 默认降序
        
        # 构建查询
        query = Project.query
        
        # 状态筛选
        if status:
            query = query.filter(Project.status == status)
        
        # 优先级筛选
        if priority:
            query = query.filter(Project.priority == priority)
        
        # 搜索功能
        if search:
            query = query.filter(Project.title.contains(search))
        
        # 排序
        if order == 'desc':
            query = query.order_by(getattr(Project, sort).desc())
        else:
            query = query.order_by(getattr(Project, sort).asc())
        
        projects = query.all()
        return jsonify({
            'success': True,
            'data': [project.to_dict() for project in projects],
            'count': len(projects)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@projects_bp.route('', methods=['POST'])
def create_project():
    """创建新项目"""
    try:
        data = request.get_json()
        
        # 验证必填字段
        if not data.get('title'):
            return jsonify({
                'success': False,
                'error': '项目名称不能为空'
            }), 400
        
        # 验证日期
        start_date = None
        end_date = None
        if data.get('start_date'):
            start_date = datetime.fromisoformat(data['start_date']).date()
        if data.get('end_date'):
            end_date = datetime.fromisoformat(data['end_date']).date()
            
        if start_date and end_date and end_date < start_date:
            return jsonify({
                'success': False,
                'error': '结束日期不能早于开始日期'
            }), 400
        
        # 创建项目
        project = Project(
            title=data['title'],
            goal=data.get('goal', ''),
            manager=data.get('manager', ''),
            participants=data.get('participants', ''),
            status=data.get('status', 'Planning'),
            priority=data.get('priority', 'Medium'),
            start_date=start_date,
            end_date=end_date
        )
        
        db.session.add(project)
        db.session.commit()
        
        # 添加创建事件到时间线
        timeline_event = TimelineEvent(
            project_id=project.id,
            comment=f"项目创建成功"
        )
        db.session.add(timeline_event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': project.to_dict(),
            'message': '项目创建成功'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@projects_bp.route('/<int:project_id>', methods=['GET'])
def get_project(project_id):
    """获取项目详情"""
    try:
        project = Project.query.get_or_404(project_id)
        
        # 获取关联数据
        project_dict = project.to_dict()
        project_dict['tasks'] = [task.to_dict() for task in project.tasks]
        project_dict['timeline_events'] = [event.to_dict() for event in project.timeline_events]
        
        return jsonify({
            'success': True,
            'data': project_dict
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@projects_bp.route('/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    """更新项目信息"""
    try:
        project = Project.query.get_or_404(project_id)
        data = request.get_json()
        
        # 更新字段
        if 'title' in data:
            project.title = data['title']
        if 'goal' in data:
            project.goal = data['goal']
        if 'manager' in data:
            project.manager = data['manager']
        if 'participants' in data:
            project.participants = data['participants']
        if 'status' in data:
            old_status = project.status
            project.status = data['status']
            
            # 添加状态变更事件
            timeline_event = TimelineEvent(
                project_id=project.id,
                comment=f"项目状态从 {old_status} 变更为 {data['status']}"
            )
            db.session.add(timeline_event)
            
        if 'priority' in data:
            project.priority = data['priority']
        if 'start_date' in data and data['start_date']:
            project.start_date = datetime.fromisoformat(data['start_date']).date()
        if 'end_date' in data and data['end_date']:
            project.end_date = datetime.fromisoformat(data['end_date']).date()
            
            # 验证日期
            if project.start_date and project.end_date and project.end_date < project.start_date:
                return jsonify({
                    'success': False,
                    'error': '结束日期不能早于开始日期'
                }), 400
                
        if 'retrospective_good' in data:
            project.retrospective_good = data['retrospective_good']
        if 'retrospective_improve' in data:
            project.retrospective_improve = data['retrospective_improve']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': project.to_dict(),
            'message': '项目更新成功'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@projects_bp.route('/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """删除项目"""
    try:
        project = Project.query.get_or_404(project_id)
        
        # 删除项目（级联删除相关任务和时间线事件）
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '项目删除成功'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@projects_bp.route('/<int:project_id>/complete', methods=['PUT'])
def complete_project(project_id):
    """标记项目为已完成"""
    try:
        project = Project.query.get_or_404(project_id)
        
        if project.status == 'Completed':
            return jsonify({
                'success': False,
                'error': '项目已经是已完成状态'
            }), 400
        
        # 更新状态
        old_status = project.status
        project.status = 'Completed'
        
        # 添加完成事件
        timeline_event = TimelineEvent(
            project_id=project.id,
            comment=f"项目已完成！状态从 {old_status} 变更为 Completed"
        )
        db.session.add(timeline_event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': project.to_dict(),
            'message': '项目已标记为完成'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500