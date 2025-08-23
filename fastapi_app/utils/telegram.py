"""
Telegram utility functions for sending messages.
Handles all Telegram Bot API interactions.
"""

import httpx
import asyncio
from typing import Dict, Any, Optional
from ..config import settings


class TelegramService:
    """Service for interacting with Telegram Bot API."""
    
    def __init__(self):
        """Initialize Telegram service."""
        self.bot_token = settings.telegram_bot_token
        self.chat_id = settings.telegram_chat_id
        self.base_url = settings.get_telegram_bot_url()
        self.client = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if not self.client:
            self.client = httpx.AsyncClient(timeout=30.0)
        return self.client
    
    async def send_message(self, message: str, 
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
            client = await self._get_client()
            response = await client.post(url, json=payload)
            
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
                
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "Request timeout"
            }
        except httpx.RequestError as e:
            return {
                "success": False,
                "error": f"Request error: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    async def send_notification(self, title: str, message: str, 
                               task_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send a formatted notification message."""
        # Format the notification message
        formatted_message = self._format_notification(title, message, task_data)
        
        return await self.send_message(formatted_message)
    
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
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to Telegram Bot API."""
        if not settings.is_telegram_configured():
            return {
                "success": False,
                "error": "Telegram not configured"
            }
        
        url = f"{self.base_url}/getMe"
        
        try:
            client = await self._get_client()
            response = await client.get(url)
            
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
    
    async def close(self) -> None:
        """Close the HTTP client."""
        if self.client:
            await self.client.aclose()
            self.client = None


# Global telegram service instance
telegram_service = TelegramService()
