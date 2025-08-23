"""
Task form dialog for creating and editing tasks.
Provides input fields for all task properties.
"""

import sys
import os
from PySide6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QFormLayout, 
                               QLineEdit, QTextEdit, QDateTimeEdit, QComboBox,
                               QPushButton, QLabel, QMessageBox)
from PySide6.QtCore import Qt, QDateTime, Signal
from PySide6.QtGui import QFont
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ..models import Task
except ImportError:
    # Fallback for direct execution
    from models import Task


class TaskFormDialog(QDialog):
    """Dialog for creating and editing tasks."""
    
    # Signals
    task_saved = Signal(Task)  # Emitted when task is saved
    
    def __init__(self, parent=None, task: Task = None, title: str = "Task"):
        """Initialize task form dialog."""
        super().__init__(parent)
        self.task = task
        self.is_editing = task is not None
        self.setWindowTitle(f"{'Edit' if self.is_editing else 'Create'} {title}")
        self.setModal(True)
        self.resize(400, 300)
        self._setup_ui()
        self._populate_form()
    
    def _setup_ui(self) -> None:
        """Setup the user interface."""
        layout = QVBoxLayout()
        
        # Title label
        title_label = QLabel(f"{'Edit' if self.is_editing else 'Create New'} Task")
        title_font = QFont()
        title_font.setPointSize(14)
        title_font.setBold(True)
        title_label.setFont(title_font)
        layout.addWidget(title_label)
        
        # Form layout
        form_layout = QFormLayout()
        
        # Task title field
        self.title_edit = QLineEdit()
        self.title_edit.setPlaceholderText("Enter task title...")
        form_layout.addRow("Title *:", self.title_edit)
        
        # Task description field
        self.description_edit = QTextEdit()
        self.description_edit.setPlaceholderText("Enter task description (optional)...")
        self.description_edit.setMaximumHeight(80)
        form_layout.addRow("Description:", self.description_edit)
        
        # Due date field
        self.due_date_edit = QDateTimeEdit()
        self.due_date_edit.setDateTime(QDateTime.currentDateTime().addDays(1))
        self.due_date_edit.setCalendarPopup(True)
        self.due_date_edit.setDisplayFormat("yyyy-MM-dd hh:mm")
        form_layout.addRow("Due Date:", self.due_date_edit)
        
        # Status field
        self.status_combo = QComboBox()
        self.status_combo.addItems(["active", "completed", "cancelled"])
        form_layout.addRow("Status:", self.status_combo)
        
        layout.addLayout(form_layout)
        
        # Button layout
        button_layout = QHBoxLayout()
        
        # Cancel button
        self.cancel_button = QPushButton("Cancel")
        self.cancel_button.clicked.connect(self.reject)
        button_layout.addWidget(self.cancel_button)
        
        button_layout.addStretch()
        
        # Save button
        self.save_button = QPushButton("Save")
        self.save_button.setDefault(True)
        self.save_button.clicked.connect(self._save_task)
        self.save_button.setStyleSheet("""
            QPushButton {
                background-color: #2196f3;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #1976d2;
            }
            QPushButton:pressed {
                background-color: #0d47a1;
            }
        """)
        button_layout.addWidget(self.save_button)
        
        layout.addLayout(button_layout)
        
        # Required field note
        note_label = QLabel("* Required fields")
        note_label.setStyleSheet("color: #666; font-size: 11px;")
        layout.addWidget(note_label)
        
        self.setLayout(layout)
    
    def _populate_form(self) -> None:
        """Populate form fields if editing existing task."""
        if not self.is_editing or not self.task:
            return
        
        self.title_edit.setText(self.task.title)
        self.description_edit.setPlainText(self.task.description or "")
        
        if self.task.due_date:
            qt_datetime = QDateTime.fromSecsSinceEpoch(int(self.task.due_date.timestamp()))
            self.due_date_edit.setDateTime(qt_datetime)
        
        # Set status
        status_index = self.status_combo.findText(self.task.status)
        if status_index >= 0:
            self.status_combo.setCurrentIndex(status_index)
    
    def _save_task(self) -> None:
        """Validate and save the task."""
        # Validate required fields
        title = self.title_edit.text().strip()
        if not title:
            QMessageBox.warning(self, "Validation Error", "Task title is required!")
            self.title_edit.setFocus()
            return
        
        # Get form values
        description = self.description_edit.toPlainText().strip()
        due_datetime = self.due_date_edit.dateTime().toPython()
        status = self.status_combo.currentText()
        
        # Create or update task
        if self.is_editing:
            # Update existing task
            self.task.title = title
            self.task.description = description
            self.task.due_date = due_datetime
            self.task.status = status
            self.task.updated_at = datetime.now()
            task_to_save = self.task
        else:
            # Create new task
            task_to_save = Task(
                title=title,
                description=description,
                due_date=due_datetime,
                status=status,
                priority_order=0  # Will be set by the calling code
            )
        
        # Emit signal and close dialog
        self.task_saved.emit(task_to_save)
        self.accept()
    
    def keyPressEvent(self, event) -> None:
        """Handle key press events."""
        if event.key() == Qt.Key.Key_Return or event.key() == Qt.Key.Key_Enter:
            # Handle Enter key based on focus
            if self.description_edit.hasFocus():
                # Allow Enter in description field
                super().keyPressEvent(event)
            else:
                # Save task on Enter
                self._save_task()
        else:
            super().keyPressEvent(event)
