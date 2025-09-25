from flask import Flask
from flask_cors import CORS
from models import db
import os
from pathlib import Path

def create_app():
    app = Flask(__name__)
    
    # 配置数据库路径为用户文档目录
    documents_path = Path.home() / 'Documents' / 'ProjectManager'
    documents_path.mkdir(exist_ok=True)
    db_path = documents_path / 'project_manager.db'
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # 初始化扩展
    db.init_app(app)
    CORS(app)
    
    # 注册蓝图
    from routes.projects import projects_bp
    from routes.tasks import tasks_bp
    from routes.timeline import timeline_bp
    from routes.templates import templates_bp
    from routes.export import export_bp
    from routes.statistics import statistics_bp
    from routes.health import health_bp
    
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(tasks_bp, url_prefix='/api')
    app.register_blueprint(timeline_bp, url_prefix='/api')
    app.register_blueprint(templates_bp, url_prefix='/api/templates')
    app.register_blueprint(export_bp, url_prefix='/api')
    app.register_blueprint(statistics_bp, url_prefix='/api')
    app.register_blueprint(health_bp)
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
        
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)