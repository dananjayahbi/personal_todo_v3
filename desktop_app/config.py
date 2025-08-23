"""
Configuration management for the desktop application.
Handles loading and saving application settings.
"""

import json
import os
from typing import Dict, Any, Optional


class Config:
    """Configuration manager for the application."""
    
    DEFAULT_CONFIG = {
        "fastapi_url": "http://localhost:8000",
        "check_interval_minutes": 5,
        "notification_minutes_ahead": 15,
        "database_path": "todo.db",
        "window_geometry": {
            "width": 800,
            "height": 600,
            "x": 100,
            "y": 100
        },
        "theme": "light"
    }
    
    def __init__(self, config_file: str = "config.json"):
        """Initialize configuration with config file path."""
        self.config_file = config_file
        self.config_data = {}
        self.load_config()
    
    def load_config(self) -> None:
        """Load configuration from file or create default."""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    self.config_data = json.load(f)
                    # Merge with defaults for any missing keys
                    self._merge_defaults()
            else:
                self.config_data = self.DEFAULT_CONFIG.copy()
                self.save_config()
                print(f"Created default config file: {self.config_file}")
        except Exception as e:
            print(f"Error loading config: {e}")
            self.config_data = self.DEFAULT_CONFIG.copy()
    
    def save_config(self) -> bool:
        """Save current configuration to file."""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self.config_data, f, indent=4)
            return True
        except Exception as e:
            print(f"Error saving config: {e}")
            return False
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by key."""
        keys = key.split('.')
        value = self.config_data
        
        try:
            for k in keys:
                value = value[k]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key: str, value: Any) -> None:
        """Set configuration value by key."""
        keys = key.split('.')
        config = self.config_data
        
        # Navigate to the parent dictionary
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        # Set the value
        config[keys[-1]] = value
    
    def _merge_defaults(self) -> None:
        """Merge default configuration with loaded config."""
        def merge_dict(default: Dict, current: Dict) -> Dict:
            for key, value in default.items():
                if key not in current:
                    current[key] = value
                elif isinstance(value, dict) and isinstance(current[key], dict):
                    merge_dict(value, current[key])
            return current
        
        self.config_data = merge_dict(self.DEFAULT_CONFIG.copy(), self.config_data)
    
    # Convenience properties for commonly used settings
    @property
    def fastapi_url(self) -> str:
        return self.get("fastapi_url")
    
    @property
    def check_interval_minutes(self) -> int:
        return self.get("check_interval_minutes")
    
    @property
    def notification_minutes_ahead(self) -> int:
        return self.get("notification_minutes_ahead")
    
    @property
    def database_path(self) -> str:
        return self.get("database_path")
    
    def is_configured(self) -> bool:
        """Check if basic configuration is set up."""
        required_fields = ["fastapi_url"]
        for field in required_fields:
            value = self.get(field)
            if not value or value.startswith("your-"):
                return False
        return True
    
    def get_missing_config_fields(self) -> list:
        """Get list of missing or default configuration fields."""
        missing = []
        checks = [
            ("fastapi_url", "FastAPI server URL")
        ]
        
        for field, description in checks:
            value = self.get(field)
            if not value or value.startswith("your-"):
                missing.append((field, description))
        
        return missing
