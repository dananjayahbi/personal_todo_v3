@echo off
echo Installing Python dependencies for Todo App Launcher...
cd /d "%~dp0"

echo.
echo Installing required Python packages...
pip install -r requirements.txt

echo.
echo Installation complete!
echo.
echo You can now run the Todo App by double-clicking "launch_todo_app.bat"
echo.
pause
