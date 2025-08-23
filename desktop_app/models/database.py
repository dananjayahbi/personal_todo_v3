"""
Database connection and initialization module.
Handles SQLite database setup and connection management.
"""

import sqlite3
import os
from typing import Optional
from datetime import datetime


class DatabaseManager:
    """Manages SQLite database connections and initialization."""
    
    def __init__(self, db_path: str = "todo.db"):
        """Initialize database manager with given database path."""
        self.db_path = db_path
        self.connection: Optional[sqlite3.Connection] = None
        self._initialize_db()
    
    def _initialize_db(self) -> None:
        """Create database and tables if they don't exist."""
        try:
            self.connection = sqlite3.connect(self.db_path)
            self.connection.execute("PRAGMA foreign_keys = ON")
            self._create_tables()
        except sqlite3.Error as e:
            print(f"Database initialization error: {e}")
            raise
    
    def _create_tables(self) -> None:
        """Create necessary tables for the application."""
        create_tasks_table = """
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            due_date DATETIME,
            status TEXT DEFAULT 'active',
            priority_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        self.connection.execute(create_tasks_table)
        self.connection.commit()
    
    def get_connection(self) -> sqlite3.Connection:
        """Get database connection."""
        if not self.connection:
            self.connection = sqlite3.connect(self.db_path)
        return self.connection
    
    def close_connection(self) -> None:
        """Close database connection."""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def execute_query(self, query: str, params: tuple = ()) -> sqlite3.Cursor:
        """Execute a query with parameters."""
        try:
            cursor = self.get_connection().cursor()
            cursor.execute(query, params)
            self.connection.commit()
            return cursor
        except sqlite3.Error as e:
            print(f"Query execution error: {e}")
            raise
    
    def fetch_all(self, query: str, params: tuple = ()) -> list:
        """Fetch all results from a query."""
        try:
            cursor = self.execute_query(query, params)
            return cursor.fetchall()
        except sqlite3.Error as e:
            print(f"Fetch all error: {e}")
            return []
    
    def fetch_one(self, query: str, params: tuple = ()) -> Optional[tuple]:
        """Fetch one result from a query."""
        try:
            cursor = self.execute_query(query, params)
            return cursor.fetchone()
        except sqlite3.Error as e:
            print(f"Fetch one error: {e}")
            return None
