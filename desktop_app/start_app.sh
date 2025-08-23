#!/bin/bash
# Start Desktop Todo App with virtual environment

cd "$(dirname "$0")"
source venv_desktop/Scripts/activate
python main.py
