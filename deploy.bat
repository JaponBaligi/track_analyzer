@echo off
REM === 1. CMD: Backend (FastAPI / Uvicorn) ===
start cmd /k "cd /d D:\spotify_monitoring && call .\venv\Scripts\activate && cd backend && uvicorn api.main:app --reload --host 127.0.0.1 --port 8000"

REM === 2. CMD: Python script (isrc-company/py/se3x.py) ===
start cmd /k "cd /d D:\spotify_monitoring && call .\venv\Scripts\activate && cd isrc-company\py && python se3x.py"

REM === 3. CMD: Web panel (npm start) ===
start cmd /k "cd /d D:\spotify_monitoring\web_panel && npm start"

REM === 4. CMD: IRSC Lookup ===
start cmd /k "cd /d D:\spotify_monitoring\isrc-company\backend\js && node token_collector.js"