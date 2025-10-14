from flask import Blueprint, request, jsonify
from models import db
from models.ai_chat import AIConfig, ChatConversation, ChatMessage, AIProvider
from services.ai_service import AIService
from flask_cors import cross_origin
import json

ai_chat_bp = Blueprint('ai_chat', __name__)

@ai_chat_bp.route('/ai/config', methods=['GET'])
@cross_origin()
def get_ai_config():
    """获取AI配置"""
    try:
        config = AIConfig.query.filter_by(is_active=True).first()
        if config:
            return jsonify({
                'success': True,
                'data': config.to_dict()
            })
        else:
            return jsonify({
                'success': True,
                'data': None,
                'message': '尚未配置AI服务'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'获取AI配置失败: {str(e)}'
        }), 500

@ai_chat_bp.route('/ai/config', methods=['POST'])
@cross_origin()
def update_ai_config():
    """更新AI配置"""
    try:
        data = request.get_json()

        # 验证必需字段
        if not data.get('provider') or not data.get('api_key'):
            return jsonify({
                'success': False,
                'error': 'AI提供商和API密钥为必需字段'
            }), 400

        # 停用现有的配置
        existing_configs = AIConfig.query.filter_by(is_active=True).all()
        for config in existing_configs:
            config.is_active = False

        # 创建新配置
        new_config = AIConfig(
            provider=AIProvider(data['provider']),
            model_name=data.get('model_name', 'gpt-3.5-turbo'),
            max_tokens=data.get('max_tokens', 1000),
            temperature=data.get('temperature', 0.7)
        )

        # 加密API密钥
        new_config.api_key = new_config.encrypt_api_key(data['api_key'])

        db.session.add(new_config)
        db.session.commit()

        # 验证API密钥
        try:
            ai_service = AIService(new_config)
            if ai_service.validate_api_key():
                return jsonify({
                    'success': True,
                    'data': new_config.to_dict(),
                    'message': 'AI配置更新成功，API密钥验证通过'
                })
            else:
                # 验证失败，回滚配置
                db.session.delete(new_config)
                # 恢复之前的配置
                for config in existing_configs:
                    config.is_active = True
                db.session.commit()

                return jsonify({
                    'success': False,
                    'error': 'API密钥验证失败，请检查密钥是否正确'
                }), 400
        except Exception as e:
            # 验证过程出错，回滚配置
            db.session.delete(new_config)
            for config in existing_configs:
                config.is_active = True
            db.session.commit()

            return jsonify({
                'success': False,
                'error': f'API验证失败: {str(e)}'
            }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'更新AI配置失败: {str(e)}'
        }), 500

@ai_chat_bp.route('/ai/conversations', methods=['GET'])
@cross_origin()
def get_conversations():
    """获取会话列表"""
    try:
        project_id = request.args.get('project_id', type=int)

        query = ChatConversation.query
        if project_id:
            query = query.filter_by(project_id=project_id)

        conversations = query.order_by(ChatConversation.updated_at.desc()).all()

        return jsonify({
            'success': True,
            'data': [conv.to_dict() for conv in conversations]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'获取会话列表失败: {str(e)}'
        }), 500

@ai_chat_bp.route('/ai/conversations', methods=['POST'])
@cross_origin()
def create_conversation():
    """创建新会话"""
    try:
        data = request.get_json()

        if not data.get('title'):
            return jsonify({
                'success': False,
                'error': '会话标题为必需字段'
            }), 400

        conversation = ChatConversation(
            project_id=data.get('project_id'),
            title=data['title']
        )

        db.session.add(conversation)
        db.session.commit()

        return jsonify({
            'success': True,
            'data': conversation.to_dict(),
            'message': '会话创建成功'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'创建会话失败: {str(e)}'
        }), 500

@ai_chat_bp.route('/ai/conversations/<int:conversation_id>/messages', methods=['GET'])
@cross_origin()
def get_messages(conversation_id):
    """获取会话消息"""
    try:
        conversation = ChatConversation.query.get_or_404(conversation_id)
        messages = ChatMessage.query.filter_by(conversation_id=conversation_id).order_by(ChatMessage.created_at.asc()).all()

        return jsonify({
            'success': True,
            'data': {
                'conversation': conversation.to_dict(),
                'messages': [msg.to_dict() for msg in messages]
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'获取会话消息失败: {str(e)}'
        }), 500

@ai_chat_bp.route('/ai/conversations/<int:conversation_id>/messages', methods=['POST'])
@cross_origin()
def send_message(conversation_id):
    """发送消息并获取AI回复"""
    try:
        data = request.get_json()

        if not data.get('content'):
            return jsonify({
                'success': False,
                'error': '消息内容为必需字段'
            }), 400

        # 检查AI配置
        config = AIConfig.query.filter_by(is_active=True).first()
        if not config:
            return jsonify({
                'success': False,
                'error': 'AI服务未配置，请先配置API密钥'
            }), 400

        conversation = ChatConversation.query.get_or_404(conversation_id)

        # 保存用户消息
        user_message = ChatMessage(
            conversation_id=conversation_id,
            role='user',
            content=data['content']
        )
        db.session.add(user_message)

        # 获取历史消息用于AI上下文
        history_messages = ChatMessage.query.filter_by(conversation_id=conversation_id).order_by(ChatMessage.created_at.asc()).all()
        ai_messages = [{"role": msg.role, "content": msg.content} for msg in history_messages]

        # 获取项目上下文
        project_context = None
        if conversation.project_id:
            from models import Project
            project = Project.query.get(conversation.project_id)
            if project:
                project_context = {
                    'title': project.title,
                    'goal': project.goal,
                    'status': project.status,
                    'start_date': project.start_date.isoformat() if project.start_date else None,
                    'end_date': project.end_date.isoformat() if project.end_date else None,
                    'tasks': [task.to_dict() for task in project.tasks]
                }

        # 调用AI服务
        ai_service = AIService(config)
        ai_response = ai_service.generate_response(ai_messages, project_context)

        # 保存AI回复
        ai_message = ChatMessage(
            conversation_id=conversation_id,
            role='assistant',
            content=ai_response
        )
        db.session.add(ai_message)

        # 更新会话时间
        conversation.updated_at = db.func.now()

        db.session.commit()

        return jsonify({
            'success': True,
            'data': ai_message.to_dict(),
            'message': 'AI回复生成成功'
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'发送消息失败: {str(e)}'
        }), 500

@ai_chat_bp.route('/ai/models', methods=['GET'])
@cross_origin()
def get_available_models():
    """获取可用的AI模型列表"""
    try:
        config = AIConfig.query.filter_by(is_active=True).first()
        if not config:
            return jsonify({
                'success': True,
                'data': []
            })

        ai_service = AIService(config)
        models = ai_service.get_available_models()

        return jsonify({
            'success': True,
            'data': models
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'获取模型列表失败: {str(e)}'
        }), 500

@ai_chat_bp.route('/ai/test', methods=['POST'])
@cross_origin()
def test_ai_config():
    """测试AI配置是否有效"""
    try:
        data = request.get_json()

        if not data.get('provider') or not data.get('api_key'):
            return jsonify({
                'success': False,
                'error': 'AI提供商和API密钥为必需字段'
            }), 400

        # 创建临时配置进行测试
        temp_config = AIConfig(
            provider=AIProvider(data['provider']),
            model_name=data.get('model_name', 'gpt-3.5-turbo'),
            api_key="",  # 将在下面设置
            max_tokens=100,
            temperature=0.7
        )
        temp_config.api_key = temp_config.encrypt_api_key(data['api_key'])

        ai_service = AIService(temp_config)
        is_valid = ai_service.validate_api_key()

        return jsonify({
            'success': is_valid,
            'message': 'API密钥有效' if is_valid else 'API密钥无效'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'API测试失败: {str(e)}'
        }), 500