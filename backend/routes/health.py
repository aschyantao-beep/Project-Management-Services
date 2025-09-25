from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'message': 'Backend service is running normally',
        'timestamp': __import__('datetime').datetime.now().isoformat()
    })