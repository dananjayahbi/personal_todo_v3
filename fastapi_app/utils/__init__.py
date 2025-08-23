"""
Utils package initialization.
"""

try:
    from .telegram import telegram_service, TelegramService
except ImportError:
    # Fallback to simple version if httpx is not available
    from .telegram_simple import telegram_service_simple as telegram_service
    from .telegram_simple import TelegramServiceSimple as TelegramService

from .auth import get_api_key, verify_api_key

__all__ = ['telegram_service', 'TelegramService', 'get_api_key', 'verify_api_key']
