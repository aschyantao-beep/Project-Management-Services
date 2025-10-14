from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import enum

db = SQLAlchemy()

# Import AI chat models
from .ai_chat import AIConfig, ChatConversation, ChatMessage, AIProvider

class ProjectStatus(enum.Enum):
    PLANNING = "Planning"
    IN_PROGRESS = "InProgress"
    COMPLETED = "Completed"
    ON_HOLD = "OnHold"

class Priority(enum.Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    goal = db.Column(db.Text)
    manager = db.Column(db.String(200))
    participants = db.Column(db.Text)
    status = db.Column(db.String(20), default='Planning')
    priority = db.Column(db.String(20), default='Medium')
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    retrospective_good = db.Column(db.Text)
    retrospective_improve = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')
    timeline_events = db.relationship('TimelineEvent', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'goal': self.goal,
            'manager': self.manager,
            'participants': self.participants,
            'status': self.status,
            'priority': self.priority,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'retrospective_good': self.retrospective_good,
            'retrospective_improve': self.retrospective_improve,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'task_count': len(self.tasks),
            'completed_task_count': len([t for t in self.tasks if t.is_completed])
        }

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'content': self.content,
            'is_completed': self.is_completed,
            'created_at': self.created_at.isoformat()
        }

class TimelineEvent(db.Model):
    __tablename__ = 'timeline_events'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'comment': self.comment,
            'created_at': self.created_at.isoformat()
        }

class ProjectTemplate(db.Model):
    __tablename__ = 'project_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    title_template = db.Column(db.String(500))
    goal_template = db.Column(db.Text)
    default_tasks = db.Column(db.Text)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'title_template': self.title_template,
            'goal_template': self.goal_template,
            'default_tasks': self.default_tasks,
            'created_at': self.created_at.isoformat()
        }