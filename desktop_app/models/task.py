"""
Task model for handling task-related database operations.
Provides CRUD operations for tasks with proper data validation.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from .database import DatabaseManager


class Task:
    """Task model representing a todo item."""
    
    def __init__(self, id: int = None, title: str = "", description: str = "", 
                 due_date: datetime = None, status: str = "active", 
                 priority_order: int = 0, created_at: datetime = None, 
                 updated_at: datetime = None):
        """Initialize a Task instance."""
        self.id = id
        self.title = title
        self.description = description
        self.due_date = due_date
        self.status = status
        self.priority_order = priority_order
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert task to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'priority_order': self.priority_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """Create Task instance from dictionary."""
        due_date = None
        if data.get('due_date'):
            due_date = datetime.fromisoformat(data['due_date'])
        
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'])
        
        updated_at = None
        if data.get('updated_at'):
            updated_at = datetime.fromisoformat(data['updated_at'])
        
        return cls(
            id=data.get('id'),
            title=data.get('title', ''),
            description=data.get('description', ''),
            due_date=due_date,
            status=data.get('status', 'active'),
            priority_order=data.get('priority_order', 0),
            created_at=created_at,
            updated_at=updated_at
        )
    
    def is_overdue(self) -> bool:
        """Check if task is overdue."""
        if not self.due_date:
            return False
        return datetime.now() > self.due_date and self.status == 'active'
    
    def is_due_soon(self, minutes: int = 15) -> bool:
        """Check if task is due within specified minutes."""
        if not self.due_date or self.status != 'active':
            return False
        
        time_diff = self.due_date - datetime.now()
        return 0 <= time_diff.total_seconds() <= minutes * 60
