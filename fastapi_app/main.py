"""
Main FastAPI application for Todo notification service.
Provides REST API endpoints for sending notifications via Telegram.
"""

import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from routers import notifications_router
    from config import settings
    from utils import telegram_service
except ImportError:
    # Fallback for direct execution
    from routers.notifications import router as notifications_router
    from config.settings import settings
    from utils.telegram_simple import telegram_service_simple as telegram_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("Starting Todo Notification API...")
    print(f"Debug mode: {settings.debug}")
    print(f"Telegram configured: {settings.is_telegram_configured()}")
    
    # Test Telegram connection on startup
    if settings.is_telegram_configured():
        try:
            # Handle both async and sync telegram services
            if hasattr(telegram_service, 'test_connection'):
                if hasattr(telegram_service.test_connection, '__call__'):
                    # Check if it's async
                    import inspect
                    if inspect.iscoroutinefunction(telegram_service.test_connection):
                        result = await telegram_service.test_connection()
                    else:
                        result = telegram_service.test_connection()
                    
                    if result["success"]:
                        bot_info = result.get("bot_info", {})
                        print(f"Telegram bot connected: @{bot_info.get('username', 'unknown')}")
                    else:
                        print(f"Telegram connection failed: {result.get('error')}")
        except Exception as e:
            print(f"Error testing Telegram connection: {e}")
    
    yield
    
    # Shutdown
    print("Shutting down Todo Notification API...")
    if hasattr(telegram_service, 'close'):
        try:
            if hasattr(telegram_service.close, '__call__'):
                import inspect
                if inspect.iscoroutinefunction(telegram_service.close):
                    await telegram_service.close()
                else:
                    telegram_service.close()
        except:
            pass


# Create FastAPI application
app = FastAPI(
    title="Todo Notification API",
    description="REST API for sending todo notifications via Telegram",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure as needed for production
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    notifications_router,
    prefix="/api/v1",
    tags=["notifications"]
)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Todo Notification API",
        "version": "1.0.0",
        "description": "REST API for sending todo notifications via Telegram",
        "endpoints": {
            "health": "/api/v1/health",
            "send_notification": "/api/v1/send-notification",
            "telegram_status": "/api/v1/telegram-status"
        },
        "docs": "/docs"
    }


def main():
    """Run the application with uvicorn."""
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info"
    )


if __name__ == "__main__":
    main()
