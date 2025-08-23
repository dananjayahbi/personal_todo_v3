#!/bin/bash
# Start FastAPI server with virtual environment

cd "$(dirname "$0")"
source venv_fastapi/Scripts/activate
python main.py
