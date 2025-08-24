"""
Task form dialog for creating and editing tasks.
Provides input fields for all task properties with modern UI.
"""

import sys
import os
from PySide6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QFormLayout, 
                               QLineEdit, QTextEdit, QDateEdit, QTimeEdit, QComboBox,
                               QPushButton, QLabel, QMessageBox, QFrame, QWidget,
                               QCalendarWidget, QGroupBox, QGridLayout)
from PySide6.QtCore import Qt, QDateTime, Signal, QDate, QTime
from PySide6.QtGui import QFont, QPixmap, QPainter
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ..models import Task
except ImportError:
    # Fallback for direct execution
    from models import Task


class TaskFormDialog(QDialog):
    """Dialog for creating and editing tasks with modern UI."""
    
    # Signals
    task_saved = Signal(Task)  # Emitted when task is saved
    
    def __init__(self, parent=None, task: Task = None, title: str = "Task"):
        """Initialize task form dialog."""
        super().__init__(parent)
        self.task = task
        self.is_editing = task is not None
        self.setWindowTitle(f"{'Edit' if self.is_editing else 'Create'} {title}")
        self.setModal(True)
        self.resize(600, 550)
        self.setStyleSheet(self._get_dialog_styles())
        self._setup_ui()
        self._populate_form()
    
    def _get_dialog_styles(self) -> str:
        """Get modern dialog styles."""
        return """
            QDialog {
                background-color: #fafafa;
                color: #212121;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            QLabel {
                color: #424242;
                font-weight: 600;
                font-size: 14px;
            }
            QLineEdit, QTextEdit {
                background-color: #ffffff;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 12px;
                font-size: 14px;
                color: #212121;
            }
            QLineEdit:focus, QTextEdit:focus {
                border-color: #2196f3;
                outline: none;
            }
            QComboBox, QDateEdit, QTimeEdit {
                background-color: #ffffff;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 10px;
                font-size: 14px;
                color: #212121;
                min-height: 20px;
            }
            QComboBox:focus, QDateEdit:focus, QTimeEdit:focus {
                border-color: #2196f3;
            }
            QComboBox::drop-down {
                border: none;
                width: 30px;
            }
            QComboBox::down-arrow {
                image: none;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 5px solid #757575;
                margin-right: 10px;
            }
            QPushButton {
                background-color: #2196f3;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                min-height: 20px;
            }
            QPushButton:hover {
                background-color: #1976d2;
            }
            QPushButton:pressed {
                background-color: #0d47a1;
            }
            QGroupBox {
                font-weight: 600;
                font-size: 16px;
                color: #424242;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                margin: 10px 0;
                padding-top: 15px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 15px;
                padding: 0 10px 0 10px;
                color: #1976d2;
            }
            QCalendarWidget {
                background-color: #ffffff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
            }
            QCalendarWidget QToolButton {
                background-color: #2196f3;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px;
            }
            QCalendarWidget QToolButton:hover {
                background-color: #1976d2;
            }
            QCalendarWidget QAbstractItemView {
                background-color: #ffffff;
                selection-background-color: #2196f3;
                selection-color: white;
            }
        """
    
    def _setup_ui(self) -> None:
        """Setup the user interface with modern styling."""
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(30, 30, 30, 30)
        main_layout.setSpacing(20)
        
        # Header
        header_layout = QVBoxLayout()
        header_layout.setSpacing(10)
        
        title_label = QLabel(f"{'Edit' if self.is_editing else 'Create New'} Task")
        title_font = QFont('Segoe UI', 20, QFont.Weight.Bold)
        title_label.setFont(title_font)
        title_label.setStyleSheet("""
            QLabel {
                color: #1976d2;
                background-color: transparent;
                margin-bottom: 10px;
            }
        """)
        header_layout.addWidget(title_label)
        
        # Subtitle
        subtitle_label = QLabel("Fill in the details below to create your task")
        subtitle_label.setStyleSheet("""
            QLabel {
                color: #757575;
                font-size: 14px;
                font-weight: normal;
                margin-bottom: 20px;
            }
        """)
        header_layout.addWidget(subtitle_label)
        
        main_layout.addLayout(header_layout)
        
        # Content in a scroll area for better UX
        content_widget = QWidget()
        content_layout = QVBoxLayout(content_widget)
        content_layout.setSpacing(20)
        
        # Task Details Group
        details_group = QGroupBox("📝 Task Details")
        details_layout = QVBoxLayout(details_group)
        details_layout.setSpacing(15)
        
        # Task title field
        title_layout = QVBoxLayout()
        title_layout.setSpacing(5)
        title_layout.addWidget(QLabel("Task Title *"))
        self.title_edit = QLineEdit()
        self.title_edit.setPlaceholderText("Enter a descriptive title for your task...")
        title_layout.addWidget(self.title_edit)
        details_layout.addLayout(title_layout)
        
        # Task description field
        desc_layout = QVBoxLayout()
        desc_layout.setSpacing(5)
        desc_layout.addWidget(QLabel("Description"))
        self.description_edit = QTextEdit()
        self.description_edit.setPlaceholderText("Add more details about your task (optional)...")
        self.description_edit.setMaximumHeight(100)
        desc_layout.addWidget(self.description_edit)
        details_layout.addLayout(desc_layout)
        
        content_layout.addWidget(details_group)
        
        # Date & Time Group
        datetime_group = QGroupBox("📅 Due Date & Time")
        datetime_layout = QVBoxLayout(datetime_group)
        datetime_layout.setSpacing(15)
        
        # Date selection
        date_layout = QVBoxLayout()
        date_layout.setSpacing(5)
        date_layout.addWidget(QLabel("Due Date"))
        
        # Create a horizontal layout for date input and calendar button
        date_input_layout = QHBoxLayout()
        self.due_date_edit = QDateEdit()
        self.due_date_edit.setDate(QDate.currentDate().addDays(1))
        self.due_date_edit.setDisplayFormat("yyyy-MM-dd (dddd)")
        self.due_date_edit.setCalendarPopup(True)
        date_input_layout.addWidget(self.due_date_edit)
        
        date_layout.addLayout(date_input_layout)
        datetime_layout.addLayout(date_layout)
        
        # Time selection with clock-style interface
        time_layout = QVBoxLayout()
        time_layout.setSpacing(5)
        time_layout.addWidget(QLabel("Due Time"))
        
        # Create time input with preset buttons
        time_input_layout = QHBoxLayout()
        self.due_time_edit = QTimeEdit()
        self.due_time_edit.setTime(QTime(9, 0))  # Default to 9:00 AM
        self.due_time_edit.setDisplayFormat("hh:mm AP")
        time_input_layout.addWidget(self.due_time_edit)
        
        # Quick time preset buttons
        preset_times_layout = QHBoxLayout()
        preset_times = [
            ("9 AM", QTime(9, 0)),
            ("12 PM", QTime(12, 0)),
            ("3 PM", QTime(15, 0)),
            ("6 PM", QTime(18, 0))
        ]
        
        for label, time in preset_times:
            btn = QPushButton(label)
            btn.setStyleSheet("""
                QPushButton {
                    background-color: #f5f5f5;
                    color: #424242;
                    border: 1px solid #e0e0e0;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    min-height: 15px;
                }
                QPushButton:hover {
                    background-color: #e0e0e0;
                }
            """)
            btn.clicked.connect(lambda checked, t=time: self.due_time_edit.setTime(t))
            preset_times_layout.addWidget(btn)
        
        time_layout.addLayout(time_input_layout)
        time_layout.addLayout(preset_times_layout)
        datetime_layout.addLayout(time_layout)
        
        content_layout.addWidget(datetime_group)
        
        # Status Group
        status_group = QGroupBox("⚡ Status")
        status_layout = QVBoxLayout(status_group)
        status_layout.setSpacing(10)
        
        status_field_layout = QVBoxLayout()
        status_field_layout.setSpacing(5)
        status_field_layout.addWidget(QLabel("Current Status"))
        self.status_combo = QComboBox()
        self.status_combo.addItems(["active", "completed", "cancelled"])
        status_field_layout.addWidget(self.status_combo)
        status_layout.addLayout(status_field_layout)
        
        content_layout.addWidget(status_group)
        
        main_layout.addWidget(content_widget)
        
        # Button layout
        button_layout = QHBoxLayout()
        button_layout.setSpacing(15)
        
        # Cancel button
        self.cancel_button = QPushButton("Cancel")
        self.cancel_button.setStyleSheet("""
            QPushButton {
                background-color: #f5f5f5;
                color: #424242;
                border: 2px solid #e0e0e0;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                min-height: 20px;
            }
            QPushButton:hover {
                background-color: #e0e0e0;
                border-color: #bdbdbd;
            }
        """)
        self.cancel_button.clicked.connect(self.reject)
        button_layout.addWidget(self.cancel_button)
        
        button_layout.addStretch()
        
        # Save button
        save_text = "💾 Update Task" if self.is_editing else "✨ Create Task"
        self.save_button = QPushButton(save_text)
        self.save_button.setDefault(True)
        self.save_button.clicked.connect(self._save_task)
        button_layout.addWidget(self.save_button)
        
        main_layout.addLayout(button_layout)
        
        # Required field note
        note_label = QLabel("* Required fields")
        note_label.setStyleSheet("""
            QLabel {
                color: #757575;
                font-size: 12px;
                font-weight: normal;
                margin-top: 10px;
            }
        """)
        main_layout.addWidget(note_label)
        
        self.setLayout(main_layout)
    
    def _populate_form(self) -> None:
        """Populate form fields if editing existing task."""
        if not self.is_editing or not self.task:
            return
        
        self.title_edit.setText(self.task.title)
        self.description_edit.setPlainText(self.task.description or "")
        
        if self.task.due_date:
            # Set date
            qt_date = QDate.fromString(self.task.due_date.strftime("%Y-%m-%d"), "yyyy-MM-dd")
            self.due_date_edit.setDate(qt_date)
            
            # Set time
            qt_time = QTime.fromString(self.task.due_date.strftime("%H:%M"), "HH:mm")
            self.due_time_edit.setTime(qt_time)
        
        # Set status
        status_index = self.status_combo.findText(self.task.status)
        if status_index >= 0:
            self.status_combo.setCurrentIndex(status_index)
    
    def _save_task(self) -> None:
        """Validate and save the task."""
        # Validate required fields
        title = self.title_edit.text().strip()
        if not title:
            QMessageBox.warning(self, "Validation Error", 
                              "Task title is required!\nPlease enter a descriptive title for your task.")
            self.title_edit.setFocus()
            return
        
        # Get form values
        description = self.description_edit.toPlainText().strip()
        
        # Combine date and time
        due_date = self.due_date_edit.date().toPython()
        due_time = self.due_time_edit.time().toPython()
        due_datetime = datetime.combine(due_date, due_time)
        
        status = self.status_combo.currentText()
        
        # Validate due date is not in the past (unless editing completed task)
        if due_datetime < datetime.now() and status == "active":
            reply = QMessageBox.question(
                self, "Past Due Date", 
                "The due date is in the past. Do you want to continue?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            )
            if reply == QMessageBox.StandardButton.No:
                return
        
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
