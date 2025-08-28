import sys
import subprocess
import threading
import time
import os
from PySide6.QtWidgets import (QApplication, QMainWindow, QVBoxLayout, QHBoxLayout, 
                               QWidget, QLabel, QPushButton, QTextEdit, QFrame, QMessageBox)
from PySide6.QtCore import Qt, QTimer, QThread, Signal, QEvent
from PySide6.QtGui import QIcon, QPixmap, QPainter, QFont, QColor
import pystray
from PIL import Image, ImageDraw
import webbrowser
import psutil

class ServerThread(QThread):
    """Thread for running the server"""
    server_started = Signal(bool)
    status_update = Signal(str)
    log_message = Signal(str)
    
    def __init__(self, launcher):
        super().__init__()
        self.launcher = launcher
        
    def run(self):
        """Start the server in background thread"""
        try:
            self.status_update.emit("Starting server...")
            self.log_message.emit("Checking for existing processes on port 8087...")
            
            # Check for existing processes
            existing_pid = self.launcher.check_port_in_use()
            if existing_pid:
                self.log_message.emit(f"Found existing process with PID {existing_pid}, terminating...")
                self.launcher.kill_process_on_port(existing_pid)
                time.sleep(3)
                self.log_message.emit("Existing process terminated")
            else:
                self.log_message.emit("Port 8087 is available")
            
            self.log_message.emit(f"Changing to project directory: {self.launcher.project_root}")
            
            # Create the command to run
            cmd = f'cd /d "{self.launcher.project_root}" && npm run start'
            self.log_message.emit("Starting Next.js server with command: npm run start")
            
            # Start the process with hidden window
            self.launcher.cmd_process = subprocess.Popen(
                f'cmd /c "{cmd}"',
                shell=True,
                cwd=self.launcher.project_root,
                creationflags=subprocess.CREATE_NO_WINDOW,
                stdout=None,
                stderr=None
            )
            
            self.launcher.server_running = True
            self.log_message.emit("Server process started in background")
            
            # Wait for server to start
            self.log_message.emit("Waiting for server to initialize...")
            time.sleep(8)
            
            # Verify server is running by checking the port
            if self.launcher.check_port_in_use():
                self.log_message.emit(f"✓ Server verified running on port {self.launcher.port}")
                self.status_update.emit("Server running in background")
                self.log_message.emit("Opening application in browser...")
                # Open browser
                webbrowser.open(f'http://localhost:{self.launcher.port}')
                self.log_message.emit("✓ Server started successfully!")
                self.server_started.emit(True)
            else:
                self.log_message.emit("✗ Server failed to start - port not in use")
                self.launcher.server_running = False
                self.status_update.emit("Failed to start server")
                self.server_started.emit(False)
                
        except Exception as e:
            error_msg = f"Error starting server: {e}"
            self.log_message.emit(f"✗ {error_msg}")
            self.status_update.emit("Failed to start server")
            self.server_started.emit(False)

class PySideTodoAppLauncher(QMainWindow):
    def __init__(self):
        super().__init__()
        self.server_running = False
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.port = 8087
        self.cmd_process = None
        self.icon = None
        self.server_thread = None
        
        # Initialize UI
        self.init_ui()
        self.create_system_tray()
        
        # Start window state monitoring
        self.state_timer = QTimer()
        self.state_timer.timeout.connect(self.check_window_state)
        self.state_timer.start(100)
        
    def init_ui(self):
        """Initialize the user interface"""
        self.setWindowTitle("Todo App Launcher")
        self.setFixedSize(500, 580)
        self.center_window()
        
        # Set modern styling
        self.setStyleSheet("""
            QMainWindow {
                background-color: #f5f5f5;
            }
            QLabel {
                color: #333;
            }
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                min-width: 100px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:pressed {
                background-color: #3d8b40;
            }
            QPushButton#stopButton {
                background-color: #f44336;
            }
            QPushButton#stopButton:hover {
                background-color: #da190b;
            }
            QPushButton#openButton {
                background-color: #2196F3;
            }
            QPushButton#openButton:hover {
                background-color: #0b7dda;
            }
            QTextEdit {
                background-color: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 8px;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 9px;
            }
            QFrame#separatorLine {
                background-color: #ddd;
                max-height: 1px;
            }
        """)
        
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        layout = QVBoxLayout(central_widget)
        layout.setSpacing(15)
        layout.setContentsMargins(30, 25, 30, 25)
        
        # Title section
        title_label = QLabel("Personal Todo App")
        title_label.setAlignment(Qt.AlignCenter)
        title_label.setFont(QFont("Arial", 18, QFont.Bold))
        layout.addWidget(title_label)
        
        # Status section
        self.status_label = QLabel("Ready to start")
        self.status_label.setAlignment(Qt.AlignCenter)
        self.status_label.setFont(QFont("Arial", 11))
        self.status_label.setStyleSheet("color: #555; padding: 10px;")
        layout.addWidget(self.status_label)
        
        # Separator
        separator = QFrame()
        separator.setObjectName("separatorLine")
        separator.setFrameShape(QFrame.HLine)
        separator.setFrameShadow(QFrame.Sunken)
        layout.addWidget(separator)
        
        # Buttons section
        buttons_layout = QHBoxLayout()
        buttons_layout.setSpacing(15)
        
        # Start button
        self.start_button = QPushButton("Start Server")
        self.start_button.clicked.connect(self.start_server)
        buttons_layout.addWidget(self.start_button)
        
        # Stop button
        self.stop_button = QPushButton("Stop Server")
        self.stop_button.setObjectName("stopButton")
        self.stop_button.clicked.connect(self.stop_server)
        buttons_layout.addWidget(self.stop_button)
        
        # Open browser button
        self.open_button = QPushButton("Open App")
        self.open_button.setObjectName("openButton")
        self.open_button.clicked.connect(self.open_browser)
        buttons_layout.addWidget(self.open_button)
        
        layout.addLayout(buttons_layout)
        
        # Info section
        info_label = QLabel(f"App URL: http://localhost:{self.port}")
        info_label.setAlignment(Qt.AlignCenter)
        info_label.setFont(QFont("Arial", 10))
        info_label.setStyleSheet("color: #2196F3; font-weight: bold;")
        layout.addWidget(info_label)

        # Console output area
        console_label = QLabel("Console Output:")
        console_label.setFont(QFont("Arial", 10, QFont.Bold))
        console_label.setStyleSheet("color: #333; margin-top: 5px;")
        layout.addWidget(console_label)
        
        self.console_output = QTextEdit()
        self.console_output.setReadOnly(True)
        self.console_output.setMinimumHeight(180)
        self.console_output.setMaximumHeight(180)
        self.console_output.setStyleSheet("""
            QTextEdit {
                background-color: #2b2b2b;
                color: #ffffff;
                font-family: 'Consolas', 'Courier New', monospace;
                font-size: 9px;
                border: 1px solid #555;
            }
        """)
        self.console_output.setText("Ready to start...\n")
        layout.addWidget(self.console_output)

        # Remove stretch to prevent extra spacing
        # layout.addStretch()
        
    def log_to_console(self, message):
        """Add a message to the console output"""
        if hasattr(self, 'console_output'):
            current_text = self.console_output.toPlainText()
            new_text = current_text + message + "\n"
            self.console_output.setPlainText(new_text)
            # Scroll to bottom
            scrollbar = self.console_output.verticalScrollBar()
            scrollbar.setValue(scrollbar.maximum())
            QApplication.processEvents()  # Update UI immediately
        
    def center_window(self):
        """Center the window on the screen"""
        screen = QApplication.primaryScreen().geometry()
        window = self.geometry()
        x = (screen.width() - window.width()) // 2
        y = (screen.height() - window.height()) // 2
        self.move(x, y)
        
    def create_icon_image(self):
        """Create a simple icon for the system tray"""
        image = Image.new('RGBA', (64, 64), color=(0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Draw a modern todo list icon
        draw.ellipse([8, 8, 56, 56], fill=(45, 123, 255, 255), outline=(33, 91, 189, 255), width=2)
        draw.line([20, 32, 28, 40], fill='white', width=3)
        draw.line([28, 40, 44, 24], fill='white', width=3)
        draw.ellipse([18, 18, 22, 22], fill='white')
        draw.ellipse([40, 42, 44, 46], fill='white')
        
        return image
        
    def check_port_in_use(self):
        """Check if port is in use"""
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.laddr.port == self.port and conn.status == psutil.CONN_LISTEN:
                    return conn.pid
            return None
        except:
            return None
    
    def kill_process_on_port(self, pid):
        """Kill process more aggressively"""
        try:
            p = psutil.Process(pid)
            
            # Get all child processes
            children = p.children(recursive=True)
            
            # Kill children first
            for child in children:
                try:
                    child.terminate()
                except:
                    pass
            
            # Wait for children to terminate
            psutil.wait_procs(children, timeout=3)
            
            # Force kill any remaining children
            for child in children:
                try:
                    if child.is_running():
                        child.kill()
                except:
                    pass
            
            # Now kill the main process
            p.terminate()
            try:
                p.wait(timeout=3)
            except psutil.TimeoutExpired:
                p.kill()
                p.wait(timeout=2)
                
            time.sleep(1)
        except Exception as e:
            # If psutil fails, try using taskkill
            try:
                import subprocess
                subprocess.run(['taskkill', '/F', '/T', '/PID', str(pid)], 
                             capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
            except:
                pass
            
    def start_server(self):
        """Start the server in a separate thread"""
        if self.server_running:
            self.log_to_console("Server is already running")
            return
            
        self.log_to_console("Initializing server startup...")
        
        # Start server thread
        self.server_thread = ServerThread(self)
        self.server_thread.status_update.connect(self.update_status)
        self.server_thread.server_started.connect(self.on_server_started)
        self.server_thread.log_message.connect(self.log_to_console)
        self.server_thread.start()
        
    def update_status(self, message):
        """Update status label"""
        self.status_label.setText(message)
        
    def on_server_started(self, success):
        """Handle server start completion"""
        if success:
            self.log_to_console("Auto-minimizing to system tray...")
            # Auto-minimize to tray after successful start
            QTimer.singleShot(1500, self.hide_to_tray)
            
    def stop_server(self):
        """Stop the server"""
        try:
            self.log_to_console("Stopping server...")
            self.status_label.setText("Stopping server...")
            QApplication.processEvents()
            
            self.server_running = False
            
            # First, try to kill our specific process if we have a reference
            if self.cmd_process:
                try:
                    self.cmd_process.terminate()
                    self.log_to_console("Terminating main server process...")
                    time.sleep(2)
                    
                    # Force kill if still running
                    if self.cmd_process.poll() is None:
                        self.cmd_process.kill()
                        self.log_to_console("Force killed main server process")
                        
                except Exception as e:
                    self.log_to_console(f"Error terminating main process: {e}")
                self.cmd_process = None
            
            # Kill any remaining processes on our port
            max_attempts = 3
            for attempt in range(max_attempts):
                existing_pid = self.check_port_in_use()
                if existing_pid:
                    self.log_to_console(f"Attempt {attempt + 1}: Found process on port {self.port} (PID: {existing_pid})")
                    self.kill_process_on_port(existing_pid)
                    time.sleep(2)
                    
                    # Check if it's still there
                    if not self.check_port_in_use():
                        self.log_to_console("✓ Process terminated successfully")
                        break
                    else:
                        self.log_to_console(f"Process still running, attempt {attempt + 1} of {max_attempts}")
                else:
                    self.log_to_console("✓ No process found on port 8087")
                    break
            
            # Final check and aggressive cleanup
            final_pid = self.check_port_in_use()
            if final_pid:
                self.log_to_console(f"WARNING: Process {final_pid} still running on port {self.port}")
                # Try using taskkill as last resort
                try:
                    import subprocess
                    subprocess.run(['taskkill', '/F', '/PID', str(final_pid)], 
                                 capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
                    self.log_to_console(f"Used taskkill /F on PID {final_pid}")
                    time.sleep(1)
                except:
                    self.log_to_console("Failed to use taskkill")
            
            self.status_label.setText("Server stopped")
            self.log_to_console("✓ Server stop process completed")
            
        except Exception as e:
            error_msg = f"Error stopping server: {e}"
            self.log_to_console(f"✗ {error_msg}")
            self.status_label.setText("Error stopping server")
            
    def open_browser(self):
        """Open the app in browser"""
        webbrowser.open(f'http://localhost:{self.port}')
        
    def hide_to_tray(self):
        """Hide window to system tray"""
        self.log_to_console("Window minimized to system tray")
        self.hide()
        
    def show_window(self, icon_param=None, item=None):
        """Show the main window"""
        self.show()
        self.raise_()
        self.activateWindow()
        
    def show_status_dialog(self, icon_param=None, item=None):
        """Show server status"""
        try:
            # Ensure this runs in the main thread by using QTimer
            def show_dialog():
                status = "Running" if self.server_running else "Stopped"
                port_info = f"Port: {self.port}"
                if self.server_running:
                    pid = self.check_port_in_use()
                    if pid:
                        port_info += f" (PID: {pid})"
                msg_box = QMessageBox()
                msg_box.setWindowTitle("Todo App Status")
                msg_box.setText(f"Server Status: {status}\n{port_info}")
                msg_box.setStandardButtons(QMessageBox.Ok)
                msg_box.exec()
            
            # Schedule to run in main thread
            QTimer.singleShot(0, show_dialog)
        except Exception as e:
            print(f"Error showing status dialog: {e}")
        
    def quit_application(self, icon_param=None, item=None):
        """Quit the application"""
        try:
            self.log_to_console("Shutting down application...")
            
            # First stop the server with enhanced cleanup
            self.stop_server()
            
            # Give it a moment to clean up
            time.sleep(2)
            
            # Double-check port cleanup
            final_check_pid = self.check_port_in_use()
            if final_check_pid:
                self.log_to_console(f"Final cleanup: killing remaining process {final_check_pid}")
                self.kill_process_on_port(final_check_pid)
                time.sleep(1)
            
            self.log_to_console("Application shutdown complete")
            
            if self.icon:
                self.icon.stop()
                
            QApplication.quit()
            sys.exit(0)
            
        except Exception as e:
            print(f"Error during quit: {e}")
            sys.exit(1)
            
    def create_system_tray(self):
        """Create system tray icon"""
        try:
            menu = pystray.Menu(
                pystray.MenuItem("Show Window", self.show_window),
                pystray.MenuItem("Open App", self.open_browser),
                pystray.MenuItem("Status", self.show_status_dialog),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("Quit", self.quit_application)
            )
            
            image = self.create_icon_image()
            self.icon = pystray.Icon("TodoApp", image, "Todo App", menu)
            
            def run_icon():
                self.icon.run()
            
            icon_thread = threading.Thread(target=run_icon, daemon=True)
            icon_thread.start()
            
        except Exception as e:
            print(f"Error creating system tray: {e}")
            
    def check_window_state(self):
        """Check if window is minimized and redirect to tray"""
        if self.isMinimized():
            self.hide_to_tray()
            
    def closeEvent(self, event):
        """Handle close event - minimize to tray instead"""
        event.ignore()
        self.hide_to_tray()
        
    def changeEvent(self, event):
        """Handle window state changes"""
        if event.type() == QEvent.WindowStateChange:
            if self.isMinimized():
                # Hide to tray when minimized
                QTimer.singleShot(10, self.hide_to_tray)
        super().changeEvent(event)

def main():
    """Main function"""
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)  # Keep app running when window is hidden
    
    # Set application properties
    app.setApplicationName("Todo App Launcher")
    app.setApplicationVersion("2.0")
    app.setOrganizationName("Personal Todo")
    
    # Create and show the launcher
    launcher = PySideTodoAppLauncher()
    launcher.show()
    
    # Run the application
    try:
        sys.exit(app.exec())
    except KeyboardInterrupt:
        launcher.quit_application()

if __name__ == "__main__":
    main()
