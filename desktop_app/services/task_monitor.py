"""
Background task monitor service.
Periodically checks for due tasks and sends notifications.
"""

import sys
import os
from PySide6.QtCore import QTimer, QObject, Signal
from datetime import datetime, timedelta
from typing import List

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .notification_service import NotificationService

try:
    from ..models import TaskRepository
except ImportError:
    # Fallback for direct execution
    from models import TaskRepository


class TaskMonitorService(QObject):
    """Background service to monitor tasks and send notifications."""
    
    # Signals for communication with GUI
    notification_sent = Signal(str)  # message
    error_occurred = Signal(str)     # error message
    
    def __init__(self, task_repository: TaskRepository, 
                 notification_service: NotificationService,
                 check_interval_minutes: int = 5):
        """Initialize task monitor service."""
        super().__init__()
        self.task_repository = task_repository
        self.notification_service = notification_service
        self.check_interval_minutes = check_interval_minutes
        self.last_notified_tasks = set()  # Track already notified tasks
        
        # Setup timer for periodic checks
        self.timer = QTimer()
        self.timer.timeout.connect(self._check_due_tasks)
        self.timer.setInterval(check_interval_minutes * 60 * 1000)  # Convert to milliseconds
    
    def start_monitoring(self) -> None:
        """Start the background monitoring service."""
        print(f"Starting task monitoring (checking every {self.check_interval_minutes} minutes)")
        self.timer.start()
        # Perform initial check
        self._check_due_tasks()
    
    def stop_monitoring(self) -> None:
        """Stop the background monitoring service."""
        print("Stopping task monitoring")
        self.timer.stop()
    
    def force_check(self) -> None:
        """Force an immediate check for due tasks."""
        print("Forcing immediate task check")
        self._check_due_tasks()
    
    def _check_due_tasks(self) -> None:
        """Check for due tasks and send notifications."""
        try:
            due_tasks = self.task_repository.get_due_tasks(minutes_ahead=15)
            
            for task in due_tasks:
                # Avoid duplicate notifications
                task_key = f"{task.id}_{task.status}"
                if task_key in self.last_notified_tasks:
                    continue
                
                # Calculate minutes until due
                if task.due_date:
                    time_diff = task.due_date - datetime.now()
                    minutes_until_due = int(time_diff.total_seconds() / 60)
                    
                    # Send notification
                    success = self.notification_service.send_due_task_alert(
                        task.title, task.due_date, minutes_until_due
                    )
                    
                    if success:
                        self.last_notified_tasks.add(task_key)
                        self.notification_sent.emit(f"Notification sent for: {task.title}")
                    else:
                        self.error_occurred.emit(f"Failed to send notification for: {task.title}")
        
        except Exception as e:
            error_msg = f"Error checking due tasks: {str(e)}"
            print(error_msg)
            self.error_occurred.emit(error_msg)
    
    def clear_notification_history(self) -> None:
        """Clear the history of notified tasks."""
        self.last_notified_tasks.clear()
        print("Notification history cleared")
    
    def set_check_interval(self, minutes: int) -> None:
        """Update the check interval."""
        self.check_interval_minutes = minutes
        if self.timer.isActive():
            self.timer.setInterval(minutes * 60 * 1000)
            print(f"Check interval updated to {minutes} minutes")
