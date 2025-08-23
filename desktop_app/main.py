"""
Main entry point for the Personal Todo Desktop Application.
Initializes all components and starts the application.
"""

import sys
import os
from PySide6.QtWidgets import QApplication, QMessageBox
from PySide6.QtCore import QCoreApplication

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import DatabaseManager, TaskRepository
from services import NotificationService, TaskMonitorService, SystemTrayService
from gui import MainWindow
from config import Config


class TodoApplication:
    """Main application class that coordinates all components."""
    
    def __init__(self):
        """Initialize the Todo application."""
        self.app = None
        self.config = None
        self.db_manager = None
        self.task_repository = None
        self.notification_service = None
        self.task_monitor = None
        self.system_tray = None
        self.main_window = None
    
    def initialize(self) -> bool:
        """Initialize all application components."""
        try:
            # Initialize Qt Application
            QCoreApplication.setApplicationName("Personal Todo App")
            QCoreApplication.setApplicationVersion("1.0.0")
            QCoreApplication.setOrganizationName("TodoApp")
            
            self.app = QApplication(sys.argv)
            self.app.setQuitOnLastWindowClosed(False)  # Keep running in system tray
            
            # Load configuration
            self.config = Config()
            
            # Check if configuration is complete
            if not self.config.is_configured():
                self._show_configuration_warning()
                return False
            
            # Initialize database
            self.db_manager = DatabaseManager(self.config.database_path)
            self.task_repository = TaskRepository(self.db_manager)
            
            # Initialize services
            self.notification_service = NotificationService(
                self.config.fastapi_url
            )
            
            self.task_monitor = TaskMonitorService(
                self.task_repository,
                self.notification_service,
                self.config.check_interval_minutes
            )
            
            self.system_tray = SystemTrayService()
            
            # Initialize main window
            self.main_window = MainWindow(
                self.task_repository,
                self.task_monitor,
                self.system_tray
            )
            
            # Connect application signals
            self._connect_signals()
            
            return True
            
        except Exception as e:
            print(f"Failed to initialize application: {e}")
            if self.app:
                QMessageBox.critical(None, "Initialization Error", 
                                   f"Failed to initialize application:\n{str(e)}")
            return False
    
    def run(self) -> int:
        """Run the application."""
        if not self.initialize():
            return 1
        
        try:
            # Show main window
            self.main_window.show()
            
            # Start system tray
            if self.system_tray.is_available():
                self.system_tray.show_tray_icon()
                print("System tray icon shown")
            else:
                print("System tray not available - application will not minimize to tray")
            
            # Start task monitoring
            self.task_monitor.start_monitoring()
            
            # Run the application
            return self.app.exec()
            
        except Exception as e:
            print(f"Application runtime error: {e}")
            return 1
        finally:
            self._cleanup()
    
    def _connect_signals(self) -> None:
        """Connect signals between components."""
        # Main window closing signal
        self.main_window.window_closing.connect(self._on_application_exit)
        
        # System tray exit signal
        self.system_tray.exit_application.connect(self._on_application_exit)
    
    def _on_application_exit(self) -> None:
        """Handle application exit."""
        print("Application exiting...")
        self._cleanup()
        self.app.quit()
    
    def _cleanup(self) -> None:
        """Cleanup resources before exit."""
        try:
            if self.task_monitor:
                self.task_monitor.stop_monitoring()
            
            if self.system_tray:
                self.system_tray.hide_tray_icon()
            
            if self.db_manager:
                self.db_manager.close_connection()
            
            # Save window geometry if window exists
            if self.main_window and self.config:
                geometry = self.main_window.geometry()
                self.config.set("window_geometry.width", geometry.width())
                self.config.set("window_geometry.height", geometry.height())
                self.config.set("window_geometry.x", geometry.x())
                self.config.set("window_geometry.y", geometry.y())
                self.config.save_config()
            
        except Exception as e:
            print(f"Error during cleanup: {e}")
    
    def _show_configuration_warning(self) -> None:
        """Show configuration warning dialog."""
        missing_fields = self.config.get_missing_config_fields()
        
        message = "The application needs to be configured before use.\n\n"
        message += "Please edit the config.json file and set the following:\n\n"
        
        for field, description in missing_fields:
            message += f"• {description} ({field})\n"
        
        message += f"\nConfig file location: {os.path.abspath(self.config.config_file)}"
        
        if self.app:
            QMessageBox.warning(None, "Configuration Required", message)
        else:
            print("CONFIGURATION REQUIRED:")
            print(message)


def main():
    """Main entry point."""
    app = TodoApplication()
    return app.run()


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
