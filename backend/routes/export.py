from flask import Blueprint, jsonify, make_response
from models import Project, Task, TimelineEvent
import json
from datetime import datetime

export_bp = Blueprint('export', __name__)

@export_bp.route('/export', methods=['GET'])
def export_data():
    """导出所有项目数据为JSON"""
    try:
        # 获取所有项目及其关联数据
        projects = Project.query.all()
        
        export_data = {
            'export_date': datetime.now().isoformat(),
            'projects_count': len(projects),
            'projects': []
        }
        
        for project in projects:
            project_data = project.to_dict()
            project_data['tasks'] = [task.to_dict() for task in project.tasks]
            project_data['timeline_events'] = [event.to_dict() for event in project.timeline_events]
            export_data['projects'].append(project_data)
        
        # 创建响应
        response = make_response(json.dumps(export_data, ensure_ascii=False, indent=2))
        response.headers['Content-Type'] = 'application/json'
        response.headers['Content-Disposition'] = f'attachment; filename=project_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        
        return response
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500