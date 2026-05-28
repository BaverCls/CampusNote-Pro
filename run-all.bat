@echo off
setlocal
echo =======================================================================
echo                 CampusNote Pro - Startup Script
echo =======================================================================
echo.

set "PYTHON_CMD=python"
where py >nul 2>nul
if %ERRORLEVEL%==0 set "PYTHON_CMD=py -3"

if exist "ai-service\.venv\Scripts\python.exe" (
    ai-service\.venv\Scripts\python.exe -c "import fastapi, uvicorn, pydantic, torch, numpy" >nul 2>nul
    if not %ERRORLEVEL%==0 (
        echo [0/3] Existing AI virtual environment is broken or incomplete.
        echo Recreating ai-service\.venv...
        rmdir /s /q ai-service\.venv
    )
)

if not exist "ai-service\.venv\Scripts\python.exe" (
    echo [0/3] Creating Python virtual environment...
    %PYTHON_CMD% -m venv ai-service\.venv
    if not %ERRORLEVEL%==0 (
        echo Failed to create the Python virtual environment.
        echo Install Python 3.10+ from python.org, then run this script again.
        pause
        exit /b 1
    )
    echo Installing dependencies into venv - this might take a moment...
    call ai-service\.venv\Scripts\activate
    python -m pip install --upgrade pip
    python -m pip install -r ai-service\requirements.txt
    echo.
)

set "MISSING_SECRET="
if "%ADMIN_EMAIL%"=="" (
    echo Missing ADMIN_EMAIL environment variable.
    set "MISSING_SECRET=1"
)
if "%ADMIN_PASSWORD%"=="" (
    echo Missing ADMIN_PASSWORD environment variable.
    set "MISSING_SECRET=1"
)
if "%SPRING_DATASOURCE_URL%"=="" (
    echo Missing SPRING_DATASOURCE_URL environment variable.
    set "MISSING_SECRET=1"
)
if "%SPRING_DATASOURCE_USERNAME%"=="" (
    echo Missing SPRING_DATASOURCE_USERNAME environment variable.
    set "MISSING_SECRET=1"
)
if "%SPRING_DATASOURCE_PASSWORD%"=="" (
    echo Missing SPRING_DATASOURCE_PASSWORD environment variable.
    set "MISSING_SECRET=1"
)
if not "%MISSING_SECRET%"=="" (
    echo.
    echo Set the required environment variables before running this script.
    pause
    exit /b 1
)

echo [1/3] Starting Python PyTorch AI Microservice on Port 9000...
start "CampusNote Pro - Python AI Service" cmd /k "cd ai-service && call .venv\Scripts\activate && python -m uvicorn service:app --host 127.0.0.1 --port 9000"

echo [2/3] Starting Spring Boot Backend on Port 8080 (PostgreSQL/Supabase Database)...
start "CampusNote Pro - Spring Boot Backend" cmd /k "cd backend && mvnw.cmd spring-boot:run"

echo [3/3] Starting React Frontend...
start "CampusNote Pro - Vite React Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================================
echo Launch complete! Three terminal windows have been opened for the services.
echo.
echo - AI Service: http://127.0.0.1:9000/docs
echo - Spring Boot: http://localhost:8080/actuator/health
echo - Frontend: use the Vite Local URL printed in the frontend terminal
echo =======================================================================
pause
