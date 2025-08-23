"""
Configuration management for FastAPI application.
Handles environment variables and application settings.
"""

import os
import json
from typing import Optional


class Settings:
    """Application settings loaded from environment variables and config file."""
    
    def __init__(self):
        """Initialize settings from environment variables and config file."""
        # Try to load from config file first
        config_data = self._load_config_file()
        
        # Environment variables take precedence over config file
        self.telegram_bot_token = os.getenv("TELEGRAM_BOT_TOKEN") or config_data.get("telegram", {}).get("bot_token", "")
        self.telegram_chat_id = os.getenv("TELEGRAM_CHAT_ID") or config_data.get("telegram", {}).get("chat_id", "")
        self.api_key = os.getenv("API_KEY", "default-api-key-change-me")
        self.debug = os.getenv("DEBUG") or config_data.get("server", {}).get("debug", False)
        if isinstance(self.debug, str):
            self.debug = self.debug.lower() == "true"
        self.host = os.getenv("HOST") or config_data.get("server", {}).get("host", "0.0.0.0")
        self.port = int(os.getenv("PORT") or config_data.get("server", {}).get("port", 8000))
        
        # Validate required settings
        self._validate()
    
    def _load_config_file(self) -> dict:
        """Load configuration from config.json file."""
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.json")
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load config file: {e}")
        return {}
    
    def _validate(self) -> None:
        """Validate that required settings are present."""
        if not self.telegram_bot_token:
            print("WARNING: TELEGRAM_BOT_TOKEN not set in environment or config file")
        
        if not self.telegram_chat_id:
            print("WARNING: TELEGRAM_CHAT_ID not set in environment or config file")
        
        if self.api_key == "default-api-key-change-me":
            print("WARNING: Using default API_KEY - please change in production")
    
    def is_telegram_configured(self) -> bool:
        """Check if Telegram configuration is complete."""
        return bool(self.telegram_bot_token and self.telegram_chat_id)
    
    def get_telegram_bot_url(self) -> str:
        """Get Telegram Bot API URL."""
        return f"https://api.telegram.org/bot{self.telegram_bot_token}"


# Global settings instance
settings = Settings()
