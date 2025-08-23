"""
Custom draggable task list widget.
Implements drag-and-drop functionality for task reordering.
"""

import sys
import os
from PySide6.QtWidgets import QListWidget, QListWidgetItem, QWidget, QVBoxLayout, QLabel, QCheckBox, QHBoxLayout
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QDrag, QPixmap, QPainter
from datetime import datetime

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
        layout.setContentsMargins(12, 8, 12, 8)
        layout.setSpacing(10)
        
        # Checkbox for completion status
        self.checkbox = QCheckBox()
        self.checkbox.setChecked(self.task.status == 'completed')
        self.checkbox.toggled.connect(self._on_checkbox_toggled)
        self.checkbox.setStyleSheet("""
            QCheckBox {
                background-color: transparent;
            }
            QCheckBox::indicator {
                width: 18px;
                height: 18px;
                border-radius: 3px;
                border: 2px solid #ccc;
                background-color: white;
            }
            QCheckBox::indicator:checked {
                background-color: #4caf50;
                border: 2px solid #4caf50;
                image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAxNCAxNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTExLjY2NjcgMy41TDUuMjUgOS45MTY2N0wyLjMzMzM3IDciIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=);
            }
        """)
        layout.addWidget(self.checkbox)
        
        # Task content layout
        content_layout = QVBoxLayout()
        content_layout.setSpacing(4)
        content_layout.setContentsMargins(0, 0, 0, 0)
        
        # Task title
        self.title_label = QLabel(self.task.title)
        self.title_label.setStyleSheet("""
            QLabel {
                font-weight: bold; 
                font-size: 14px;
                color: #333;
                background-color: transparent;
            }
        """)
        self.title_label.setWordWrap(True)
        content_layout.addWidget(self.title_label)
        
        # Task description (if exists)
        if self.task.description:
            self.desc_label = QLabel(self.task.description)
            self.desc_label.setStyleSheet("""
                QLabel {
                    color: #666; 
                    font-size: 12px;
                    background-color: transparent;
                }
            """)
            self.desc_label.setWordWrap(True)
            content_layout.addWidget(self.desc_label)
        
        # Due date (if exists)
        if self.task.due_date:
            due_text = self.task.due_date.strftime("%Y-%m-%d %H:%M")
            self.due_label = QLabel(f"📅 Due: {due_text}")
            
            # Color code based on due status
            if self.task.is_overdue():
                style = "color: #d32f2f; font-size: 11px; background-color: transparent; font-weight: bold;"
            elif self.task.is_due_soon():
                style = "color: #f57c00; font-size: 11px; background-color: transparent; font-weight: bold;"
            else:
                style = "color: #666; font-size: 11px; background-color: transparent;"
            
            self.due_label.setStyleSheet(f"QLabel {{ {style} }}")
            content_layout.addWidget(self.due_label)
        
        layout.addLayout(content_layout)
        layout.addStretch()
        
        # Set overall styling
        self.setStyleSheet("""
            TaskListItem {
                background-color: transparent;
                border: none;
            }
            TaskListItem:hover {
                background-color: #f8f9fa;
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
