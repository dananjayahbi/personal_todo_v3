"""
System tray service for background operation.
Manages system tray icon and context menu.
"""

from PySide6.QtWidgets import QSystemTrayIcon, QMenu, QApplication
from PySide6.QtCore import QObject, Signal
from PySide6.QtGui import QIcon, QAction


class SystemTrayService(QObject):
    """Service for managing system tray functionality."""
    
    # Signals
    show_main_window = Signal()
    force_check_requested = Signal()
    exit_application = Signal()
    
    def __init__(self, icon_path: str = None):
        """Initialize system tray service."""
        super().__init__()
        self.tray_icon = None
        self.icon_path = icon_path
        self._setup_tray_icon()
    
    def _setup_tray_icon(self) -> None:
        """Setup system tray icon and menu."""
        if not QSystemTrayIcon.isSystemTrayAvailable():
            print("System tray is not available on this system")
            return
        
        # Create tray icon
        self.tray_icon = QSystemTrayIcon()
        
        # Set icon (use default if no path provided)
        if self.icon_path:
            icon = QIcon(self.icon_path)
        else:
            # Use application icon as fallback
            icon = QApplication.style().standardIcon(
                QApplication.style().StandardPixmap.SP_ComputerIcon
            )
        
        self.tray_icon.setIcon(icon)
        self.tray_icon.setToolTip("Personal Todo App")
        
        # Create context menu
        self._create_context_menu()
        
        # Connect double-click to show main window
        self.tray_icon.activated.connect(self._on_tray_icon_activated)
    
    def _create_context_menu(self) -> None:
        """Create context menu for tray icon."""
        if not self.tray_icon:
            return
        
        menu = QMenu()
        
        # Show main window action
        show_action = QAction("Show Todo App", menu)
        show_action.triggered.connect(self.show_main_window.emit)
        menu.addAction(show_action)
        
        menu.addSeparator()
        
        # Force check action
        check_action = QAction("Check for Due Tasks", menu)
        check_action.triggered.connect(self.force_check_requested.emit)
        menu.addAction(check_action)
        
        menu.addSeparator()
        
        # Exit action
        exit_action = QAction("Exit", menu)
        exit_action.triggered.connect(self.exit_application.emit)
        menu.addAction(exit_action)
        
        self.tray_icon.setContextMenu(menu)
    
    def _on_tray_icon_activated(self, reason) -> None:
        """Handle tray icon activation."""
        if reason == QSystemTrayIcon.ActivationReason.DoubleClick:
            self.show_main_window.emit()
    
    def show_tray_icon(self) -> None:
        """Show the system tray icon."""
        if self.tray_icon and QSystemTrayIcon.isSystemTrayAvailable():
            self.tray_icon.show()
            print("System tray icon shown")
        else:
            print("Cannot show system tray icon")
    
    def hide_tray_icon(self) -> None:
        """Hide the system tray icon."""
        if self.tray_icon:
            self.tray_icon.hide()
            print("System tray icon hidden")
    
    def show_message(self, title: str, message: str, 
                     icon: QSystemTrayIcon.MessageIcon = QSystemTrayIcon.MessageIcon.Information,
                     timeout: int = 5000) -> None:
        """Show tray notification message."""
        if self.tray_icon and self.tray_icon.isVisible():
            self.tray_icon.showMessage(title, message, icon, timeout)
    
    def is_available(self) -> bool:
        """Check if system tray is available."""
        return QSystemTrayIcon.isSystemTrayAvailable()
    
    def is_visible(self) -> bool:
        """Check if tray icon is visible."""
        return self.tray_icon and self.tray_icon.isVisible()
