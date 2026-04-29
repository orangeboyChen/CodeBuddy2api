@echo off
echo Starting CodeBuddy2API...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Check environment variables and load from .env if exists
if not defined CODEBUDDY_PASSWORD (
    if exist ".env" (
        echo Loading configuration from .env file...
        for /f "tokens=1,2 delims==" %%a in (.env) do (
            if "%%a"=="CODEBUDDY_PASSWORD" set CODEBUDDY_PASSWORD=%%b
        )
    )
    if not defined CODEBUDDY_PASSWORD (
        echo WARNING: CODEBUDDY_PASSWORD environment variable is not set
        echo Please set it in .env file or as environment variable
        set /p CODEBUDDY_PASSWORD="Enter password for API access: "
    ) else (
        echo Using password from .env file
    )
)

REM Start service
echo Starting CodeBuddy2API service...
python web.py

pause