# Desktop Launcher for Personal Todo App

This folder contains the desktop launcher for the Personal Todo App, providing a modern PySide6 interface with system tray integration and hidden terminal functionality.

## Features

- **Modern PySide6 UI**: Native-looking interface with professional styling
- **System Tray Integration**: Launcher window automatically minimizes to system tray after starting server
- **Hidden Terminal**: Runs the server in background without showing command prompt windows
- **Smart Minimize**: Minimize button always hides to system tray (not taskbar)
- **System Tray Icon**: Provides quick access to app controls from the system tray
- **Port Management**: Automatically uses port 8087 and handles port conflicts
- **Process Management**: Properly starts and stops the Next.js server
- **Auto Browser Launch**: Opens the app in your default browser when started
- **Clean Shutdown**: Properly terminates all processes when quitting

## Prerequisites

- Python 3.7 or higher
- Node.js and npm (for the Next.js app)
- Windows OS

## Installation

1. **Install Python Dependencies**:
   - Double-click `install_dependencies.bat` to install required Python packages
   - Or manually run: `pip install -r requirements.txt`

2. **Required Python Packages**:
   - `pystray` - For system tray functionality
   - `Pillow` - For icon image creation
   - `psutil` - For process management
   - `PySide6` - For modern, native UI components

## Usage

### Method 1: VBScript (Completely Silent - Recommended)
- Double-click `start_todo_app.vbs` - This starts completely silently with no windows

### Method 2: Batch File (Brief Window)
- Double-click `start_todo_app.bat` - This shows a brief command window then disappears

### Method 3: Direct Python (For Debugging)
- Run: `python launcher.py` from this directory - Shows console output for debugging

## Starting the App Silently

For the best user experience with no visible terminal windows:
1. **Use the VBScript**: Double-click `start_todo_app.vbs`
2. **Check System Tray**: Look for the Todo app icon in your system tray
3. **Wait for Browser**: The app will automatically open in your browser after a few seconds

## How It Works

1. **Startup Process**:
   - Checks if port 8087 is already in use
   - Kills any existing processes on port 8087 if found
   - Navigates to the project root directory
   - Starts the Next.js server with `npm run start` in hidden terminal
   - Opens the app in your default browser
   - Creates a system tray icon for easy access
   - **Automatically minimizes launcher window to system tray**

2. **System Tray Integration**:
   - After starting the server, the launcher window automatically hides
   - Access controls via the system tray icon (right-click)
   - **Show Window**: Restore the launcher window
   - **Open App**: Opens the app in your browser
   - **Status**: Shows current server status
   - **Quit**: Properly shuts down the server and exits

3. **Hidden Terminal Mode**:
   - Server runs in background without visible command prompt
   - No terminal windows clutter your desktop
   - Server functions exactly like manual `npm run start`
   - Proper process management ensures clean operation

4. **Port Management**:
   - Uses psutil for efficient process detection
   - Gracefully terminates conflicting processes
   - Ensures clean port usage for the app

## Troubleshooting

### Port Already in Use
- The launcher automatically handles port conflicts
- If issues persist, manually check running processes
- Restart the launcher to resolve conflicts

### Python Dependencies Missing
- Run `install_dependencies.bat` as administrator
- Or install manually: `pip install pystray Pillow psutil`

### Server Won't Start
- Ensure Node.js and npm are installed
- Check that the project root contains `package.json`
- Verify npm dependencies are installed in the project root
- Try running `npm run start` manually first

### System Tray Icon Not Appearing
- Check Windows notification area settings
- Ensure Python has permission to create system tray icons
- Try running as administrator

## Files Description

- `launcher.py` - Main Python launcher script
- `start_todo_app.bat` - Batch file for easy launching
- `install_dependencies.bat` - Installs Python dependencies
- `requirements.txt` - Python package requirements
- `README.md` - This documentation file

## Configuration

The launcher is configured to:
- Use modern PySide6 interface with native Windows styling
- Use port 8087 for the Next.js app
- Run server in hidden terminal mode
- Automatically minimize to system tray after starting
- Handle minimize button clicks to hide to tray (not taskbar)
- Automatically open browser to `http://localhost:8087`
- Create a blue checkmark icon in the system tray
- Handle process management automatically

## Security Notes

- The launcher uses graceful process termination when possible
- Force termination is used only when necessary
- Only processes on port 8087 are targeted for termination
- The launcher runs with the same privileges as the user who started it

## Prerequisites

- Python 3.7 or higher
- Node.js and npm (for the Next.js app)
- Windows OS

## Installation

1. **Install Python Dependencies**:
   - Double-click `install_dependencies.bat` to install required Python packages
   - Or manually run: `pip install -r requirements.txt`

2. **Required Python Packages**:
   - `pystray` - For system tray functionality
   - `Pillow` - For icon image creation
   - `psutil` - For process management

## Usage

### Method 1: Batch File (Recommended)
- Double-click `launch_todo_app.bat` to start the launcher

### Method 2: Direct Python Execution
- Run: `python launcher.py` from this directory

## How It Works

1. **Startup Process**:
   - Checks if port 8087 is already in use
   - Kills any existing processes on port 8087 if found
   - Navigates to the project root directory
   - Starts the Next.js server with `npm run start`
   - Opens the app in your default browser
   - Creates a system tray icon for easy access

2. **System Tray Features**:
   - **Open App**: Opens the app in your browser
   - **Status**: Shows current server status
   - **Quit**: Properly shuts down the server and exits

3. **Port Management**:
   - Uses `netstat -ano | findstr :8087` to detect processes on port 8087
   - Uses `taskkill /PID <PID> /F` to terminate conflicting processes
   - Ensures clean port usage for the app

## Troubleshooting

### Port Already in Use
- The launcher automatically handles port conflicts
- If issues persist, manually check: `netstat -ano | findstr :8087`
- Kill processes manually: `taskkill /PID <PID> /F`

### Python Dependencies Missing
- Run `install_dependencies.bat` as administrator
- Or install manually: `pip install pystray Pillow psutil`

### Server Won't Start
- Ensure Node.js and npm are installed
- Check that the project root contains `package.json`
- Verify npm dependencies are installed in the project root

### System Tray Icon Not Appearing
- Check Windows notification area settings
- Ensure Python has permission to create system tray icons
- Try running as administrator

## Files Description

- `launcher.py` - Main Python launcher script
- `launch_todo_app.bat` - Batch file for easy launching
- `install_dependencies.bat` - Installs Python dependencies
- `requirements.txt` - Python package requirements
- `README.md` - This documentation file

## Configuration

The launcher is configured to:
- Use port 8087 for the Next.js app
- Automatically open browser to `http://localhost:8087`
- Create a blue "T" icon in the system tray
- Handle process management automatically

## Security Notes

- The launcher uses `taskkill /F` which forcefully terminates processes
- Only processes on port 8087 are targeted for termination
- The launcher runs with the same privileges as the user who started it
