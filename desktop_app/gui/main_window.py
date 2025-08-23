"""
Main application window for the Todo app.
Contains the primary user interface and coordinates all components.
"""

import sys
import os
from PySide6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
                               QPushButton, QLineEdit, QComboBox, QLabel, 
                               QMessageBox, QStatusBar, QSplitter)
from PySide6.QtCore import Qt, Signal, QTimer
from PySide6.QtGui import QFont, QAction
from typing import List

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .task_list_widget import DraggableTaskList
from .task_form_dialog import TaskFormDialog

try:
    from ..models import Task, TaskRepository
    from ..services import TaskMonitorService, SystemTrayService
except ImportError:
    # Fallback for direct execution
    from models import Task, TaskRepository
    from services import TaskMonitorService, SystemTrayService


class MainWindow(QMainWindow):
    """Main application window."""
    
    # Signals
    window_closing = Signal()
    
    def __init__(self, task_repository: TaskRepository, 
                 task_monitor: TaskMonitorService,
                 system_tray: SystemTrayService):
        """Initialize main window."""
        super().__init__()
        self.task_repository = task_repository
        self.task_monitor = task_monitor
        self.system_tray = system_tray
        self.current_filter = "all"
        
        self.setWindowTitle("Personal Todo App")
        self.setMinimumSize(700, 500)
        self.resize(900, 650)
        
        # Set application style
        self.setStyleSheet("""
            QMainWindow {
                background-color: #ffffff;
            }
        """)
        
        self._setup_ui()
        self._connect_signals()
        self._load_tasks()
        
        # Status update timer
        self.status_timer = QTimer()
        self.status_timer.timeout.connect(self._update_status)
        self.status_timer.start(60000)  # Update every minute
    
    def _setup_ui(self) -> None:
        """Setup the user interface."""
        central_widget = QWidget()
        central_widget.setStyleSheet("""
            QWidget {
                background-color: #ffffff;
            }
        """)
        self.setCentralWidget(central_widget)
        
        main_layout = QHBoxLayout()
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        central_widget.setLayout(main_layout)
        
        # Create splitter for sidebar and main content
        splitter = QSplitter(Qt.Orientation.Horizontal)
        splitter.setStyleSheet("""
            QSplitter::handle {
                background-color: #ddd;
                width: 2px;
            }
        """)
        main_layout.addWidget(splitter)
        
        # Sidebar
        sidebar = self._create_sidebar()
        splitter.addWidget(sidebar)
        
        # Main content area
        content_area = self._create_content_area()
        splitter.addWidget(content_area)
        
        # Set splitter proportions
        splitter.setSizes([250, 550])
        
        # Status bar
        self.status_bar = QStatusBar()
        self.status_bar.setStyleSheet("""
            QStatusBar {
                background-color: #f0f0f0;
                border-top: 1px solid #ccc;
                color: #333;
            }
        """)
        self.setStatusBar(self.status_bar)
        self._update_status()
    
    def _create_sidebar(self) -> QWidget:
        """Create sidebar with filters and controls."""
        sidebar = QWidget()
        sidebar.setMaximumWidth(250)
        sidebar.setMinimumWidth(200)
        sidebar.setStyleSheet("""
            QWidget {
                background-color: #f8f9fa;
                border-right: 1px solid #dee2e6;
            }
            QLabel {
                background-color: transparent;
            }
            QComboBox {
                background-color: white;
                border: 1px solid #ced4da;
                border-radius: 4px;
                padding: 5px;
                min-height: 20px;
            }
            QLineEdit {
                background-color: white;
                border: 1px solid #ced4da;
                border-radius: 4px;
                padding: 5px;
                min-height: 20px;
            }
            QPushButton {
                background-color: #4caf50;
                color: white;
                border: none;
                padding: 8px;
                border-radius: 4px;
                font-weight: bold;
                min-height: 20px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        
        layout = QVBoxLayout()
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(10)
        
        # Title
        title_label = QLabel("Todo App")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title_label.setFont(title_font)
        layout.addWidget(title_label)
        
        layout.addSpacing(20)
        
        # Filters
        filter_label = QLabel("Filter Tasks")
        filter_label.setStyleSheet("font-weight: bold; margin-bottom: 5px;")
        layout.addWidget(filter_label)
        
        self.filter_combo = QComboBox()
        self.filter_combo.addItems([
            "All Tasks", "Active", "Completed", "Overdue", "Due Soon"
        ])
        self.filter_combo.currentTextChanged.connect(self._on_filter_changed)
        layout.addWidget(self.filter_combo)
        
        layout.addSpacing(20)
        
        # Search
        search_label = QLabel("Search")
        search_label.setStyleSheet("font-weight: bold; margin-bottom: 5px;")
        layout.addWidget(search_label)
        
        self.search_edit = QLineEdit()
        self.search_edit.setPlaceholderText("Search tasks...")
        self.search_edit.textChanged.connect(self._on_search_changed)
        layout.addWidget(self.search_edit)
        
        layout.addSpacing(20)
        
        # Actions
        actions_label = QLabel("Actions")
        actions_label.setStyleSheet("font-weight: bold; margin-bottom: 5px;")
        layout.addWidget(actions_label)
        
        # Add task button
        self.add_button = QPushButton("Add New Task")
        self.add_button.clicked.connect(self._add_task)
        layout.addWidget(self.add_button)
        
        # Check now button
        self.check_button = QPushButton("Check Due Tasks")
        self.check_button.setStyleSheet("""
            QPushButton {
                background-color: #2196f3;
                color: white;
                border: none;
                padding: 8px;
                border-radius: 4px;
                font-weight: bold;
                min-height: 20px;
            }
            QPushButton:hover {
                background-color: #1976d2;
            }
        """)
        self.check_button.clicked.connect(self._force_check)
        layout.addWidget(self.check_button)
        
        layout.addStretch()
        
        sidebar.setLayout(layout)
        return sidebar
    
    def _create_content_area(self) -> QWidget:
        """Create main content area with task list."""
        content = QWidget()
        content.setStyleSheet("""
            QWidget {
                background-color: #ffffff;
            }
            QLabel {
                background-color: transparent;
            }
        """)
        layout = QVBoxLayout()
        layout.setContentsMargins(15, 15, 15, 15)
        layout.setSpacing(10)
        
        # Task list header
        header_layout = QHBoxLayout()
        header_layout.setSpacing(10)
        
        self.tasks_label = QLabel("All Tasks")
        header_font = QFont()
        header_font.setPointSize(16)
        header_font.setBold(True)
        self.tasks_label.setFont(header_font)
        self.tasks_label.setStyleSheet("color: #333; background-color: transparent;")
        header_layout.addWidget(self.tasks_label)
        
        header_layout.addStretch()
        
        # Quick add button
        quick_add_button = QPushButton("+ Quick Add")
        quick_add_button.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: bold;
                min-height: 25px;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
        """)
        quick_add_button.clicked.connect(self._add_task)
        header_layout.addWidget(quick_add_button)
        
        layout.addLayout(header_layout)
        
        # Task list container with better styling
        task_container = QWidget()
        task_container.setStyleSheet("""
            QWidget {
                background-color: #ffffff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
            }
        """)
        task_layout = QVBoxLayout(task_container)
        task_layout.setContentsMargins(0, 0, 0, 0)
        
        # Task list
        self.task_list = DraggableTaskList()
        self.task_list.setStyleSheet("""
            QListWidget {
                border: none;
                border-radius: 8px;
                background-color: #ffffff;
                outline: none;
            }
            QListWidget::item {
                border-bottom: 1px solid #f0f0f0;
                padding: 8px;
                margin: 0px;
                border-radius: 0px;
                background-color: #ffffff;
            }
            QListWidget::item:selected {
                background-color: #e3f2fd;
                border: 1px solid #2196f3;
                border-radius: 4px;
            }
            QListWidget::item:hover {
                background-color: #f8f9fa;
            }
        """)
        task_layout.addWidget(self.task_list)
        
        layout.addWidget(task_container)
        
        content.setLayout(layout)
        return content
    
    def _connect_signals(self) -> None:
        """Connect signals from various components."""
        # Task list signals
        self.task_list.task_order_changed.connect(self._on_task_order_changed)
        self.task_list.task_toggled.connect(self._on_task_toggled)
        self.task_list.task_edit_requested.connect(self._edit_task)
        
        # Task monitor signals
        self.task_monitor.notification_sent.connect(self._on_notification_sent)
        self.task_monitor.error_occurred.connect(self._on_monitor_error)
        
        # System tray signals
        self.system_tray.show_main_window.connect(self.show_and_raise)
        self.system_tray.force_check_requested.connect(self._force_check)
        self.system_tray.exit_application.connect(self.close_application)
    
    def _load_tasks(self) -> None:
        """Load and display tasks based on current filter."""
        try:
            if self.current_filter == "all":
                tasks = self.task_repository.get_all_tasks()
            elif self.current_filter == "active":
                tasks = self.task_repository.get_all_tasks(status="active")
            elif self.current_filter == "completed":
                tasks = self.task_repository.get_all_tasks(status="completed")
            elif self.current_filter == "overdue":
                all_tasks = self.task_repository.get_all_tasks(status="active")
                tasks = [task for task in all_tasks if task.is_overdue()]
            elif self.current_filter == "due_soon":
                all_tasks = self.task_repository.get_all_tasks(status="active")
                tasks = [task for task in all_tasks if task.is_due_soon()]
            else:
                tasks = self.task_repository.get_all_tasks()
            
            # Apply search filter if active
            search_text = self.search_edit.text().strip().lower()
            if search_text:
                tasks = [task for task in tasks 
                        if search_text in task.title.lower() or 
                           search_text in (task.description or "").lower()]
            
            # Update task list
            self.task_list.clear_tasks()
            
            # Add empty state if no tasks
            if not tasks:
                self._show_empty_state()
            else:
                for task in tasks:
                    self.task_list.add_task(task)
            
            # Update header
            filter_names = {
                "all": "All Tasks",
                "active": "Active Tasks", 
                "completed": "Completed Tasks",
                "overdue": "Overdue Tasks",
                "due_soon": "Due Soon"
            }
            header_text = filter_names.get(self.current_filter, "Tasks")
            if search_text:
                header_text += f" (searching: {search_text})"
            self.tasks_label.setText(f"{header_text} ({len(tasks)})")
            
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to load tasks: {str(e)}")
    
    def _show_empty_state(self) -> None:
        """Show empty state when no tasks are available."""
        from PySide6.QtWidgets import QListWidgetItem
        
        empty_item = QListWidgetItem()
        empty_widget = QWidget()
        empty_widget.setStyleSheet("background-color: transparent;")
        
        empty_layout = QVBoxLayout(empty_widget)
        empty_layout.setContentsMargins(40, 60, 40, 60)
        empty_layout.setSpacing(15)
        
        empty_icon = QLabel("📝")
        empty_icon.setStyleSheet("""
            QLabel {
                font-size: 48px;
                color: #bbb;
                background-color: transparent;
            }
        """)
        empty_icon.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        empty_title = QLabel("No tasks found")
        empty_title.setStyleSheet("""
            QLabel {
                font-size: 18px;
                font-weight: bold;
                color: #666;
                background-color: transparent;
            }
        """)
        empty_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        empty_subtitle = QLabel("Click 'Add New Task' to get started!")
        empty_subtitle.setStyleSheet("""
            QLabel {
                font-size: 14px;
                color: #999;
                background-color: transparent;
            }
        """)
        empty_subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        empty_layout.addWidget(empty_icon)
        empty_layout.addWidget(empty_title)
        empty_layout.addWidget(empty_subtitle)
        
        empty_item.setSizeHint(empty_widget.sizeHint())
        self.task_list.addItem(empty_item)
        self.task_list.setItemWidget(empty_item, empty_widget)
    
    def _add_task(self) -> None:
        """Show dialog to add new task."""
        dialog = TaskFormDialog(self, title="Task")
        dialog.task_saved.connect(self._on_task_saved)
        dialog.exec()
    
    def _edit_task(self, task_id: int) -> None:
        """Show dialog to edit existing task."""
        task = self.task_repository.get_task_by_id(task_id)
        if task:
            dialog = TaskFormDialog(self, task=task, title="Task")
            dialog.task_saved.connect(self._on_task_updated)
            dialog.exec()
    
    def _on_task_saved(self, task: Task) -> None:
        """Handle new task creation."""
        try:
            # Set priority order to last
            all_tasks = self.task_repository.get_all_tasks()
            task.priority_order = len(all_tasks)
            
            task_id = self.task_repository.create_task(task)
            if task_id:
                self._load_tasks()
                self.status_bar.showMessage(f"Task '{task.title}' created successfully", 3000)
            else:
                QMessageBox.warning(self, "Error", "Failed to create task")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to create task: {str(e)}")
    
    def _on_task_updated(self, task: Task) -> None:
        """Handle task update."""
        try:
            success = self.task_repository.update_task(task)
            if success:
                self._load_tasks()
                self.status_bar.showMessage(f"Task '{task.title}' updated successfully", 3000)
            else:
                QMessageBox.warning(self, "Error", "Failed to update task")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to update task: {str(e)}")
    
    def _on_task_toggled(self, task_id: int, completed: bool) -> None:
        """Handle task completion toggle."""
        try:
            task = self.task_repository.get_task_by_id(task_id)
            if task:
                task.status = "completed" if completed else "active"
                success = self.task_repository.update_task(task)
                if success:
                    self.status_bar.showMessage(
                        f"Task marked as {'completed' if completed else 'active'}", 2000
                    )
                    # Send notification for completed task
                    if completed and hasattr(self, 'task_monitor'):
                        self.task_monitor.notification_service.send_task_completed_alert(task.title)
                else:
                    QMessageBox.warning(self, "Error", "Failed to update task status")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to toggle task: {str(e)}")
    
    def _on_task_order_changed(self, task_ids: List[int]) -> None:
        """Handle task reordering."""
        try:
            success = self.task_repository.update_priorities(task_ids)
            if success:
                self.status_bar.showMessage("Task order updated", 2000)
            else:
                QMessageBox.warning(self, "Error", "Failed to update task order")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed to reorder tasks: {str(e)}")
    
    def _on_filter_changed(self, filter_text: str) -> None:
        """Handle filter change."""
        filter_map = {
            "All Tasks": "all",
            "Active": "active",
            "Completed": "completed", 
            "Overdue": "overdue",
            "Due Soon": "due_soon"
        }
        self.current_filter = filter_map.get(filter_text, "all")
        self._load_tasks()
    
    def _on_search_changed(self, search_text: str) -> None:
        """Handle search text change."""
        self._load_tasks()
    
    def _force_check(self) -> None:
        """Force check for due tasks."""
        self.task_monitor.force_check()
        self.status_bar.showMessage("Checking for due tasks...", 2000)
    
    def _on_notification_sent(self, message: str) -> None:
        """Handle notification sent signal."""
        self.status_bar.showMessage(message, 3000)
    
    def _on_monitor_error(self, error_message: str) -> None:
        """Handle monitor error signal."""
        self.status_bar.showMessage(f"Monitor error: {error_message}", 5000)
    
    def _update_status(self) -> None:
        """Update status bar with task counts."""
        try:
            active_tasks = len(self.task_repository.get_all_tasks(status="active"))
            completed_tasks = len(self.task_repository.get_all_tasks(status="completed"))
            due_tasks = len(self.task_repository.get_due_tasks())
            
            status_text = f"Active: {active_tasks} | Completed: {completed_tasks} | Due: {due_tasks}"
            self.status_bar.showMessage(status_text)
        except:
            pass
    
    def show_and_raise(self) -> None:
        """Show window and bring to front."""
        self.show()
        self.raise_()
        self.activateWindow()
    
    def closeEvent(self, event) -> None:
        """Handle window close event."""
        if self.system_tray.is_visible():
            # Hide to tray instead of closing
            self.hide()
            self.system_tray.show_message(
                "Todo App", 
                "Application minimized to tray",
                timeout=2000
            )
            event.ignore()
        else:
            # Actually close the application
            self.close_application()
            event.accept()
    
    def close_application(self) -> None:
        """Close the application completely."""
        self.window_closing.emit()
        self.close()
