@echo off
set "ROOT=%~dp0"
REM Adjust VENV if your virtualenv lives elsewhere (e.g. %ROOT%venv)
set "VENV_PY=%ROOT%venv\Scripts\activate.bat"

REM === 1. Backend (FastAPI / Uvicorn) ===
start cmd /k "cd /d "%ROOT%" && call "%VENV_PY%" && cd backend && uvicorn api.main:app --reload --host 127.0.0.1 --port 8000"

REM === 2. isrc-company Flask (licensor_lookup_server.py) ===
start cmd /k "cd /d "%ROOT%" && call "%VENV_PY%" && cd isrc-company\py && python licensor_lookup_server.py"

REM === 3. Web panel ===
start cmd /k "cd /d "%ROOT%web_panel%" && npm start"

REM === 4. Token collector (optional) ===
start cmd /k "cd /d "%ROOT%isrc-company\backend\js%" && node token_collector.js"
