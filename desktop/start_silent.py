"""
Silent launcher wrapper for PySide6 Todo App
This script properly launches the PySide6 application without showing console windows
"""
import subprocess
import sys
import os

def main():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    launcher_path = os.path.join(script_dir, "launcher.py")
    parent_dir = os.path.dirname(script_dir)
    
    # Change to parent directory
    os.chdir(parent_dir)
    
    # Start the PySide6 launcher without console window
    subprocess.Popen([
        sys.executable, launcher_path
    ], 
    creationflags=subprocess.CREATE_NO_WINDOW,
    cwd=parent_dir
    )

if __name__ == "__main__":
    main()
