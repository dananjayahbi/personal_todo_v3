@echo off
REM Start Desktop Todo App with virtual environment

cd /d "%~dp0"
call venv_desktop\Scripts\activate.bat
python main.py
