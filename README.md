# Personal Todo App v3

A comprehensive personal todo application with desktop GUI, background notifications, and Telegram integration.

## Features

- **Desktop Application**: Modern PySide6-based GUI with drag-and-drop task reordering
- **Background Service**: System tray integration with continuous task monitoring  
- **Telegram Notifications**: Automated alerts for due and overdue tasks
- **Local Database**: SQLite database for offline task storage
- **FastAPI Backend**: Cloud-deployable notification service
- **CRUD Operations**: Full task management with priority handling

## Architecture

The system consists of two main components:

1. **Desktop App** (`desktop_app/`): PySide6 GUI application that manages tasks locally
2. **FastAPI App** (`fastapi_app/`): Cloud notification service that sends Telegram messages

## Quick Start

### 1. Desktop Application Setup

```bash
cd desktop_app
pip install -r requirements.txt
python main.py
```

On first run, edit the generated `config.json` file with your API settings.

### 2. FastAPI Service Setup

```bash
cd fastapi_app
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Telegram bot token and settings
python main.py
```

### 3. Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/BotFather) on Telegram
2. Get your bot token and chat ID
3. Add these to your FastAPI `.env` file and desktop `config.json`

## Project Structure

```
personal_todo_v3/
├── desktop_app/           # PySide6 desktop application
│   ├── gui/              # User interface components
│   ├── models/           # Database models and repositories  
│   ├── services/         # Background services
│   ├── config.py         # Configuration management
│   └── main.py           # Application entry point
├── fastapi_app/          # FastAPI notification service
│   ├── routers/          # API route handlers
│   ├── utils/            # Utility functions
│   ├── config/           # Configuration settings
│   └── main.py           # FastAPI application
└── README.md             # This file
```

## Usage

1. **Task Management**: Create, edit, delete, and reorder tasks via drag-and-drop
2. **Background Monitoring**: App runs in system tray monitoring for due tasks
3. **Notifications**: Automatic Telegram alerts 15 minutes before due time
4. **Filters**: View tasks by status (All, Active, Completed, Overdue, Due Soon)
5. **Search**: Find tasks by title or description

## Configuration

### Desktop App (`config.json`)
```json
{
  "fastapi_url": "http://localhost:8000",
  "api_key": "your-api-key",
  "telegram_chat_id": "your-chat-id",
  "check_interval_minutes": 5,
  "notification_minutes_ahead": 15
}
```

### FastAPI App (`.env`)
```
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id  
API_KEY=your-secure-api-key
DEBUG=false
PORT=8000
```

## Development

The codebase is modularized with files kept under 150 lines each for maintainability:

- **Models**: Database interaction and task management
- **Services**: Background monitoring and notification handling
- **GUI**: User interface components with custom widgets
- **Config**: Environment and settings management
- **Utils**: Helper functions and API integrations

## Requirements

- Python 3.10+
- PySide6 (for desktop GUI)
- FastAPI + Uvicorn (for notification service)  
- SQLite (built-in with Python)
- Telegram Bot API access

## Deployment

### Desktop App
Package as executable using PyInstaller:
```bash
pip install pyinstaller
pyinstaller --windowed --onefile main.py
```

### FastAPI Service
Deploy to cloud platforms like Heroku, Vercel, or AWS:
```bash
# Example for Heroku
pip install gunicorn
echo "web: gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker" > Procfile
```

## License

MIT License - see LICENSE file for details