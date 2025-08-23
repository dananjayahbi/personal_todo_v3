"""
API routes for notification handling.
Defines endpoints for sending notifications and health checks.
"""

import sys
import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ..utils import telegram_service, get_api_key
except ImportError:
    # Fallback for direct execution
    from utils.telegram_simple import telegram_service_simple as telegram_service
    from utils.auth import get_api_key

router = APIRouter()


class NotificationRequest(BaseModel):
    """Request model for sending notifications."""
    message: str
    timestamp: Optional[str] = None
    task_data: Optional[Dict[str, Any]] = None


class NotificationResponse(BaseModel):
    """Response model for notification requests."""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


@router.post("/send-notification", response_model=NotificationResponse)
async def send_notification(
    request: NotificationRequest
) -> NotificationResponse:
    """
    Send a notification message via Telegram.
    
    Open endpoint for desktop app communication.
    """
    try:
        # Send notification via Telegram
        # Handle both async and sync telegram services
        import inspect
        if hasattr(telegram_service, 'send_message'):
            if inspect.iscoroutinefunction(telegram_service.send_message):
                result = await telegram_service.send_message(
                    message=request.message
                )
            else:
                result = telegram_service.send_message(
                    message=request.message
                )
        else:
            raise Exception("Telegram service not available")
        
        if result["success"]:
            return NotificationResponse(
                success=True,
                message="Notification sent successfully",
                data={
                    "message_id": result.get("message_id"),
                    "timestamp": request.timestamp or datetime.now().isoformat()
                }
            )
        else:
            # Log the error but don't expose internal details
            print(f"Telegram error: {result.get('error')}")
            
            return NotificationResponse(
                success=False,
                message="Failed to send notification",
                data={"error": "Telegram delivery failed"}
            )
            
    except Exception as e:
        print(f"Notification endpoint error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while sending notification"
        )


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint.
    
    Does not require authentication.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "todo-notification-api",
        "version": "1.0.0"
    }


@router.get("/telegram-status")
async def telegram_status(
    api_key: str = Depends(get_api_key)
) -> Dict[str, Any]:
    """
    Check Telegram bot connection status.
    
    Requires valid API key in X-API-Key header.
    """
    try:
        # Handle both async and sync telegram services
        import inspect
        if hasattr(telegram_service, 'test_connection'):
            if inspect.iscoroutinefunction(telegram_service.test_connection):
                result = await telegram_service.test_connection()
            else:
                result = telegram_service.test_connection()
        else:
            result = {"success": False, "error": "Telegram service not available"}
        
        return {
            "telegram_configured": result["success"],
            "status": "connected" if result["success"] else "disconnected",
            "bot_info": result.get("bot_info", {}),
            "error": result.get("error") if not result["success"] else None,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Telegram status check error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error checking Telegram status"
        )
