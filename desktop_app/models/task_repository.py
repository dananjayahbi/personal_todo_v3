"""
Task repository for database operations.
Handles all database interactions for task management.
"""

from datetime import datetime
from typing import List, Optional
from .database import DatabaseManager
from .task import Task


class TaskRepository:
    """Repository class for task database operations."""
    
    def __init__(self, db_manager: DatabaseManager):
        """Initialize with database manager."""
        self.db_manager = db_manager
    
    def create_task(self, task: Task) -> Optional[int]:
        """Create a new task in the database."""
        query = """
        INSERT INTO tasks (title, description, due_date, status, priority_order)
        VALUES (?, ?, ?, ?, ?)
        """
        
        due_date_str = task.due_date.isoformat() if task.due_date else None
        params = (task.title, task.description, due_date_str, 
                 task.status, task.priority_order)
        
        try:
            cursor = self.db_manager.execute_query(query, params)
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating task: {e}")
            return None
    
    def get_task_by_id(self, task_id: int) -> Optional[Task]:
        """Get a task by its ID."""
        query = "SELECT * FROM tasks WHERE id = ?"
        result = self.db_manager.fetch_one(query, (task_id,))
        
        if result:
            return self._row_to_task(result)
        return None
    
    def get_all_tasks(self, status: str = None) -> List[Task]:
        """Get all tasks, optionally filtered by status."""
        if status:
            query = "SELECT * FROM tasks WHERE status = ? ORDER BY priority_order, id"
            results = self.db_manager.fetch_all(query, (status,))
        else:
            query = "SELECT * FROM tasks ORDER BY priority_order, id"
            results = self.db_manager.fetch_all(query)
        
        return [self._row_to_task(row) for row in results]
    
    def update_task(self, task: Task) -> bool:
        """Update an existing task."""
        query = """
        UPDATE tasks 
        SET title = ?, description = ?, due_date = ?, status = ?, 
            priority_order = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """
        
        due_date_str = task.due_date.isoformat() if task.due_date else None
        params = (task.title, task.description, due_date_str, 
                 task.status, task.priority_order, task.id)
        
        try:
            self.db_manager.execute_query(query, params)
            return True
        except Exception as e:
            print(f"Error updating task: {e}")
            return False
    
    def delete_task(self, task_id: int) -> bool:
        """Delete a task by its ID."""
        query = "DELETE FROM tasks WHERE id = ?"
        
        try:
            self.db_manager.execute_query(query, (task_id,))
            return True
        except Exception as e:
            print(f"Error deleting task: {e}")
            return False
    
    def get_due_tasks(self, minutes_ahead: int = 15) -> List[Task]:
        """Get tasks that are due soon or overdue."""
        all_tasks = self.get_all_tasks(status='active')
        due_tasks = []
        
        for task in all_tasks:
            if task.is_overdue() or task.is_due_soon(minutes_ahead):
                due_tasks.append(task)
        
        return due_tasks
    
    def update_priorities(self, task_ids: List[int]) -> bool:
        """Update priority order for multiple tasks."""
        try:
            for index, task_id in enumerate(task_ids):
                query = "UPDATE tasks SET priority_order = ? WHERE id = ?"
                self.db_manager.execute_query(query, (index, task_id))
            return True
        except Exception as e:
            print(f"Error updating priorities: {e}")
            return False
    
    def _row_to_task(self, row: tuple) -> Task:
        """Convert database row to Task object."""
        id, title, description, due_date_str, status, priority_order, created_at_str, updated_at_str = row
        
        due_date = None
        if due_date_str:
            due_date = datetime.fromisoformat(due_date_str)
        
        created_at = None
        if created_at_str:
            created_at = datetime.fromisoformat(created_at_str)
        
        updated_at = None
        if updated_at_str:
            updated_at = datetime.fromisoformat(updated_at_str)
        
        return Task(
            id=id,
            title=title,
            description=description,
            due_date=due_date,
            status=status,
            priority_order=priority_order,
            created_at=created_at,
            updated_at=updated_at
        )
