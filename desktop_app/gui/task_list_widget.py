"""
Custom draggable task list widget.
Implements drag-and-drop functionality for task reordering.
"""

import sys
import os
from PySide6.QtWidgets import QListWidget, QListWidgetItem, QWidget, QVBoxLayout, QLabel, QCheckBox, QHBoxLayout
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QDrag, QPixmap, QPainter
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ..models import Task
except ImportError:
    # Fallback for direct execution
    from models import Task


class TaskListItem(QWidget):
    """Custom widget for displaying task information."""
    
    # Signals
    task_toggled = Signal(int, bool)  # task_id, completed
    task_edit_requested = Signal(int)  # task_id
    
    def __init__(self, task: Task):
        """Initialize task list item."""
        super().__init__()
        self.task = task
        self._setup_ui()
    
    def _setup_ui(self) -> None:
        """Setup the user interface for the task item."""
        layout = QHBoxLayout()
        layout.setContentsMargins(20, 15, 20, 15)
        layout.setSpacing(15)
        
        # Checkbox for completion status with modern styling
        self.checkbox = QCheckBox()
        self.checkbox.setChecked(self.task.status == 'completed')
        self.checkbox.toggled.connect(self._on_checkbox_toggled)
        self.checkbox.setStyleSheet("""
            QCheckBox {
                background-color: transparent;
            }
            QCheckBox::indicator {
                width: 20px;
                height: 20px;
                border-radius: 4px;
                border: 2px solid #bdbdbd;
                background-color: white;
            }
            QCheckBox::indicator:hover {
                border-color: #2196f3;
            }
            QCheckBox::indicator:checked {
                background-color: #4caf50;
                border: 2px solid #4caf50;
                image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEzIDUuNUw2LjUgMTJMMyA4LjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMi4yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==);
            }
        """)
        layout.addWidget(self.checkbox)
        
        # Task content layout
        content_layout = QVBoxLayout()
        content_layout.setSpacing(6)
        content_layout.setContentsMargins(0, 0, 0, 0)
        
        # Task title with improved styling
        self.title_label = QLabel(self.task.title)
        title_style = """
            QLabel {
                font-weight: 600; 
                font-size: 16px;
                color: #212121;
                background-color: transparent;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
        """
        
        # Add strikethrough for completed tasks
        if self.task.status == 'completed':
            title_style = """
                QLabel {
                    font-weight: 600; 
                    font-size: 16px;
                    color: #9e9e9e;
                    background-color: transparent;
                    text-decoration: line-through;
                    font-family: 'Segoe UI', Arial, sans-serif;
                }
            """
        
        self.title_label.setStyleSheet(title_style)
        self.title_label.setWordWrap(True)
        content_layout.addWidget(self.title_label)
        
        # Task description (if exists)
        if self.task.description:
            self.desc_label = QLabel(self.task.description)
            desc_style = """
                QLabel {
                    color: #757575; 
                    font-size: 14px;
                    background-color: transparent;
                    font-family: 'Segoe UI', Arial, sans-serif;
                }
            """
            if self.task.status == 'completed':
                desc_style = """
                    QLabel {
                        color: #bdbdbd; 
                        font-size: 14px;
                        background-color: transparent;
                        text-decoration: line-through;
                        font-family: 'Segoe UI', Arial, sans-serif;
                    }
                """
            self.desc_label.setStyleSheet(desc_style)
            self.desc_label.setWordWrap(True)
            content_layout.addWidget(self.desc_label)
        
        # Due date with better formatting and status indicators
        if self.task.due_date:
            due_text = self.task.due_date.strftime("%b %d, %Y at %I:%M %p")
            
            # Determine due status
            now = datetime.now()
            if self.task.due_date < now and self.task.status == 'active':
                # Overdue
                due_display = f"🔴 Overdue: {due_text}"
                due_color = "#f44336"
            elif self.task.due_date < now + timedelta(hours=24) and self.task.status == 'active':
                # Due soon
                due_display = f"🟡 Due Soon: {due_text}"
                due_color = "#ff9800"
            else:
                # Normal
                due_display = f"📅 Due: {due_text}"
                due_color = "#757575"
            
            if self.task.status == 'completed':
                due_color = "#bdbdbd"
            
            self.due_label = QLabel(due_display)
            self.due_label.setStyleSheet(f"""
                QLabel {{
                    color: {due_color}; 
                    font-size: 13px;
                    font-weight: 500;
                    background-color: transparent;
                    font-family: 'Segoe UI', Arial, sans-serif;
                }}
            """)
            content_layout.addWidget(self.due_label)
        
        layout.addLayout(content_layout)
        
        # Status badge on the right
        status_layout = QVBoxLayout()
        status_layout.setAlignment(Qt.AlignmentFlag.AlignTop | Qt.AlignmentFlag.AlignRight)
        
        if self.task.status == 'completed':
            status_badge = QLabel("✓ Completed")
            status_badge.setStyleSheet("""
                QLabel {
                    background-color: #4caf50;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    font-family: 'Segoe UI', Arial, sans-serif;
                }
            """)
        elif self.task.status == 'cancelled':
            status_badge = QLabel("✗ Cancelled")
            status_badge.setStyleSheet("""
                QLabel {
                    background-color: #f44336;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    font-family: 'Segoe UI', Arial, sans-serif;
                }
            """)
        else:
            # Check if overdue
            if (self.task.due_date and 
                self.task.due_date < datetime.now() and 
                self.task.status == 'active'):
                status_badge = QLabel("⚠ Overdue")
                status_badge.setStyleSheet("""
                    QLabel {
                        background-color: #f44336;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 600;
                        font-family: 'Segoe UI', Arial, sans-serif;
                    }
                """)
            else:
                status_badge = QLabel("📝 Active")
                status_badge.setStyleSheet("""
                    QLabel {
                        background-color: #2196f3;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 600;
                        font-family: 'Segoe UI', Arial, sans-serif;
                    }
                """)
        
        status_layout.addWidget(status_badge)
        layout.addLayout(status_layout)
        
        # Set overall styling with modern card appearance
        self.setStyleSheet("""
            TaskListItem {
                background-color: transparent;
                border: none;
                border-radius: 8px;
                margin: 2px;
            }
            TaskListItem:hover {
                background-color: #f5f5f5;
            }
        """)
        
        self.setLayout(layout)
        
        # Apply completed styling if task is completed
        if self.task.status == 'completed':
            self._apply_completed_styling()
    
    def _on_checkbox_toggled(self, checked: bool) -> None:
        """Handle checkbox toggle."""
        self.task_toggled.emit(self.task.id, checked)
        
        if checked:
            self._apply_completed_styling()
        else:
            self._remove_completed_styling()
    
    def _apply_completed_styling(self) -> None:
        """Apply styling for completed tasks."""
        self.title_label.setStyleSheet("""
            QLabel {
                font-weight: bold; 
                font-size: 14px;
                text-decoration: line-through; 
                color: #999;
                background-color: transparent;
            }
        """)
        if hasattr(self, 'desc_label'):
            self.desc_label.setStyleSheet("""
                QLabel {
                    color: #999; 
                    font-size: 12px; 
                    text-decoration: line-through;
                    background-color: transparent;
                }
            """)
    
    def _remove_completed_styling(self) -> None:
        """Remove styling for completed tasks."""
        self.title_label.setStyleSheet("""
            QLabel {
                font-weight: bold; 
                font-size: 14px;
                color: #333;
                background-color: transparent;
            }
        """)
        if hasattr(self, 'desc_label'):
            self.desc_label.setStyleSheet("""
                QLabel {
                    color: #666; 
                    font-size: 12px;
                    background-color: transparent;
                }
            """)
    
    def mouseDoubleClickEvent(self, event) -> None:
        """Handle double-click to edit task."""
        self.task_edit_requested.emit(self.task.id)
        super().mouseDoubleClickEvent(event)


class DraggableTaskList(QListWidget):
    """Custom list widget with drag-and-drop support for task reordering."""
    
    # Signals
    task_order_changed = Signal(list)  # list of task IDs in new order
    task_toggled = Signal(int, bool)   # task_id, completed
    task_edit_requested = Signal(int)  # task_id
    
    def __init__(self, parent=None):
        """Initialize draggable task list."""
        super().__init__(parent)
        self._setup_drag_drop()
        self._setup_styling()
    
    def _setup_drag_drop(self) -> None:
        """Configure drag and drop settings."""
        self.setDragDropMode(QListWidget.DragDropMode.InternalMove)
        self.setDefaultDropAction(Qt.DropAction.MoveAction)
        self.setDragEnabled(True)
        self.setAcceptDrops(True)
    
    def _setup_styling(self) -> None:
        """Apply custom styling to the list."""
        self.setStyleSheet("""
            QListWidget {
                border: none;
                border-radius: 8px;
                background-color: #ffffff;
                outline: none;
                alternate-background-color: #f8f9fa;
            }
            QListWidget::item {
                border: none;
                border-bottom: 1px solid #f0f0f0;
                padding: 0px;
                margin: 0px;
                background-color: #ffffff;
                min-height: 60px;
            }
            QListWidget::item:selected {
                background-color: #e3f2fd;
                border: 1px solid #2196f3;
                border-radius: 6px;
                margin: 2px;
            }
            QListWidget::item:hover {
                background-color: #f8f9fa;
                border-radius: 6px;
                margin: 2px;
            }
        """)
    
    def add_task(self, task: Task) -> None:
        """Add a task to the list."""
        list_item = QListWidgetItem()
        task_widget = TaskListItem(task)
        
        # Connect signals
        task_widget.task_toggled.connect(self.task_toggled.emit)
        task_widget.task_edit_requested.connect(self.task_edit_requested.emit)
        
        list_item.setSizeHint(task_widget.sizeHint())
        self.addItem(list_item)
        self.setItemWidget(list_item, task_widget)
    
    def clear_tasks(self) -> None:
        """Clear all tasks from the list."""
        self.clear()
    
    def get_task_order(self) -> list:
        """Get the current order of task IDs."""
        task_ids = []
        for i in range(self.count()):
            item = self.item(i)
            widget = self.itemWidget(item)
            if isinstance(widget, TaskListItem):
                task_ids.append(widget.task.id)
        return task_ids
    
    def dropEvent(self, event) -> None:
        """Handle drop event and emit order change signal."""
        super().dropEvent(event)
        # Emit signal with new task order
        new_order = self.get_task_order()
        self.task_order_changed.emit(new_order)
