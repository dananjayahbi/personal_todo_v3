@echo off
REM Start FastAPI server with virtual environment

cd /d "%~dp0"
call venv_fastapi\Scripts\activate.bat
python main.py
