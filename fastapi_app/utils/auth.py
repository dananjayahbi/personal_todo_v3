"""
Authentication utilities for API security.
Provides middleware and functions for API key validation.
"""

import sys
import os
from fastapi import HTTPException, Security, Depends
from fastapi.security import APIKeyHeader

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ..config import settings
except ImportError:
    # Fallback for direct execution
    from config.settings import settings

# API Key header security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_api_key(api_key: str = Security(api_key_header)) -> str:
    """Validate API key from header."""
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="API key is required"
        )
    
    if api_key != settings.api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )
    
    return api_key


def verify_api_key(api_key: str) -> bool:
    """Simple API key verification function."""
    return api_key == settings.api_key
