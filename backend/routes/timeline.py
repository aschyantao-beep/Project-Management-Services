from flask import Blueprint, request, jsonify
from models import db, TimelineEvent, Project

timeline_bp = Blueprint('timeline', __name__)

@timeline_bp.route('/projects/<int:project_id>/timeline', methods=['POST'])
def create_timeline_event(project_id):
    """为项目添加新动态"""
    try:
        project = Project.query.get_or_404(project_id)
        data = request.get_json()
        
        if not data.get('comment'):
            return jsonify({
                'success': False,
                'error': '动态内容不能为空'
            }), 400
        
        timeline_event = TimelineEvent(
            project_id=project_id,
            comment=data['comment']
        )
        
        db.session.add(timeline_event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': timeline_event.to_dict(),
            'message': '动态添加成功'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@timeline_bp.route('/timeline/<int:event_id>', methods=['DELETE'])
def delete_timeline_event(event_id):
    """删除时间线事件"""
    try:
        event = TimelineEvent.query.get_or_404(event_id)
        
        db.session.delete(event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '动态删除成功'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500