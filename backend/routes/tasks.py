from flask import Blueprint, request, jsonify
from models import db, Task, Project

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/projects/<int:project_id>/tasks', methods=['POST'])
def create_task(project_id):
    """为项目创建新任务"""
    try:
        project = Project.query.get_or_404(project_id)
        data = request.get_json()
        
        if not data.get('content'):
            return jsonify({
                'success': False,
                'error': '任务内容不能为空'
            }), 400
        
        task = Task(
            project_id=project_id,
            content=data['content']
        )
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': task.to_dict(),
            'message': '任务创建成功'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@tasks_bp.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """更新任务（主要是完成状态）"""
    try:
        task = Task.query.get_or_404(task_id)
        data = request.get_json()
        
        if 'is_completed' in data:
            task.is_completed = data['is_completed']
            
            # 添加完成事件
            from models import TimelineEvent
            status_text = "已完成" if task.is_completed else "已重新打开"
            timeline_event = TimelineEvent(
                project_id=task.project_id,
                comment=f"任务 '{task.content[:20]}...' {status_text}"
            )
            db.session.add(timeline_event)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': task.to_dict(),
            'message': '任务更新成功'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@tasks_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """删除任务"""
    try:
        task = Task.query.get_or_404(task_id)
        project_id = task.project_id
        
        db.session.delete(task)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '任务删除成功'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500