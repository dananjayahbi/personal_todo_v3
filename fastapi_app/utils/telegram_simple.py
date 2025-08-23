"""
Alternative Telegram utility using requests instead of httpx.
Simpler implementation to avoid dependency issues.
"""

import sys
import os
import requests
import json
from typing import Dict, Any, Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ..config import settings
except ImportError:
    # Fallback for direct execution
    from config.settings import settings


class TelegramServiceSimple:
    """Simple service for interacting with Telegram Bot API using requests."""
    
    def __init__(self):
        """Initialize Telegram service."""
        self.bot_token = settings.telegram_bot_token
        self.chat_id = settings.telegram_chat_id
        self.base_url = settings.get_telegram_bot_url()
        self.session = requests.Session()
        self.session.timeout = 30
    
    def send_message(self, message: str, 
                    chat_id: Optional[str] = None,
                    parse_mode: str = "HTML") -> Dict[str, Any]:
        """Send a message to Telegram chat."""
        if not settings.is_telegram_configured():
            return {
                "success": False,
                "error": "Telegram not configured"
            }
        
        target_chat_id = chat_id or self.chat_id
        url = f"{self.base_url}/sendMessage"
        
        payload = {
            "chat_id": target_chat_id,
            "text": message,
            "parse_mode": parse_mode
        }
        
        try:
            response = self.session.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "message_id": result.get("result", {}).get("message_id"),
                    "response": result
                }
            else:
                error_detail = response.json() if response.content else "Unknown error"
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {error_detail}",
                    "status_code": response.status_code
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Request timeout"
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"Request error: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    def send_notification(self, title: str, message: str, 
                         task_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send a formatted notification message."""
        # Format the notification message
        formatted_message = self._format_notification(title, message, task_data)
        
        return self.send_message(formatted_message)
    
    def _format_notification(self, title: str, message: str, 
                           task_data: Dict[str, Any] = None) -> str:
        """Format notification message for Telegram."""
        formatted = f"<b>{title}</b>\n\n{message}"
        
        if task_data:
            formatted += "\n\n<i>Task Details:</i>"
            
            if task_data.get("title"):
                formatted += f"\n• <b>Title:</b> {task_data['title']}"
            
            if task_data.get("due_date"):
                formatted += f"\n• <b>Due:</b> {task_data['due_date']}"
            
            if task_data.get("alert_type"):
                alert_type = task_data["alert_type"].replace("_", " ").title()
                formatted += f"\n• <b>Type:</b> {alert_type}"
        
        return formatted
    
    def test_connection(self) -> Dict[str, Any]:
        """Test connection to Telegram Bot API."""
        if not settings.is_telegram_configured():
            return {
                "success": False,
                "error": "Telegram not configured"
            }
        
        url = f"{self.base_url}/getMe"
        
        try:
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                bot_info = response.json()
                return {
                    "success": True,
                    "bot_info": bot_info.get("result", {}),
                    "message": "Connection successful"
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "status_code": response.status_code
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Connection error: {str(e)}"
            }


# Global telegram service instance
telegram_service_simple = TelegramServiceSimple()
