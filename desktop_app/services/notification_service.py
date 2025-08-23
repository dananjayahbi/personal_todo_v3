"""
Notification service for sending alerts via FastAPI to Telegram.
Handles HTTP requests to the notification backend.
"""

import requests
import json
from typing import Dict, Any, Optional
from datetime import datetime


class NotificationService:
    """Service for sending notifications to FastAPI backend."""
    
    def __init__(self, api_url: str):
        """Initialize notification service with API details."""
        self.api_url = api_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })
    
    def send_notification(self, message: str, task_data: Dict[str, Any] = None) -> bool:
        """Send notification message to FastAPI backend."""
        endpoint = f"{self.api_url}/api/v1/send-notification"
        
        payload = {
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'task_data': task_data or {}
        }
        
        try:
            response = self.session.post(
                endpoint,
                data=json.dumps(payload),
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"Notification sent successfully: {message}")
                return True
            else:
                print(f"Failed to send notification. Status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"Network error sending notification: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error sending notification: {e}")
            return False
    
    def send_due_task_alert(self, task_title: str, due_date: datetime, 
                           minutes_until_due: int) -> bool:
        """Send alert for task that is due soon."""
        if minutes_until_due <= 0:
            message = f"⚠️ Task '{task_title}' is overdue!"
        else:
            message = f"⏰ Task '{task_title}' is due in {minutes_until_due} minutes!"
        
        task_data = {
            'title': task_title,
            'due_date': due_date.isoformat(),
            'alert_type': 'due_soon' if minutes_until_due > 0 else 'overdue'
        }
        
        return self.send_notification(message, task_data)
    
    def send_task_completed_alert(self, task_title: str) -> bool:
        """Send alert for completed task."""
        message = f"✅ Task '{task_title}' has been completed!"
        
        task_data = {
            'title': task_title,
            'alert_type': 'completed'
        }
        
        return self.send_notification(message, task_data)
    
    def test_connection(self) -> bool:
        """Test connection to the FastAPI backend."""
        try:
            endpoint = f"{self.api_url}/api/v1/health"
            response = self.session.get(endpoint, timeout=5)
            return response.status_code == 200
        except:
            return False
