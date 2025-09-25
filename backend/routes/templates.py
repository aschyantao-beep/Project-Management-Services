from flask import Blueprint, request, jsonify
from models import db, ProjectTemplate
import json

templates_bp = Blueprint('templates', __name__)

@templates_bp.route('', methods=['GET'])
def get_templates():
    """获取所有项目模板"""
    try:
        templates = ProjectTemplate.query.order_by(ProjectTemplate.created_at.desc()).all()
        return jsonify({
            'success': True,
            'data': [template.to_dict() for template in templates]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@templates_bp.route('', methods=['POST'])
def create_template():
    """创建项目模板"""
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({
                'success': False,
                'error': '模板名称不能为空'
            }), 400
        
        template = ProjectTemplate(
            name=data['name'],
            title_template=data.get('title_template', ''),
            goal_template=data.get('goal_template', ''),
            default_tasks=json.dumps(data.get('default_tasks', []))
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': template.to_dict(),
            'message': '模板创建成功'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@templates_bp.route('/<int:template_id>', methods=['GET'])
def get_template(template_id):
    """获取模板详情"""
    try:
        template = ProjectTemplate.query.get_or_404(template_id)
        return jsonify({
            'success': True,
            'data': template.to_dict()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500