@echo off
echo ==================================================
echo    AetherBio AI - Docker Launcher (Windows)
echo ==================================================

echo.
echo Running: docker compose up --build -d
docker compose up --build -d

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Docker compose failed to start!
    exit /b %ERRORLEVEL%
)

echo.
echo Waiting 5 seconds for services to initialize...
ping 127.0.0.1 -n 6 >nul

echo.
echo Running: docker ps
docker ps

echo.
echo Testing Backend API Health Check (http://localhost:8000/api/v1/health)...
powershell -Command "try { $res = Invoke-RestMethod -Uri 'http://localhost:8000/api/v1/health'; Write-Host 'Backend Health Status (200):'; Write-Host ($res | ConvertTo-Json) } catch { Write-Host 'Health check warning:' $_.Exception.Message }"

echo.
echo ==================================================
echo AetherBio AI Docker Setup is Live!
echo Frontend UI:  http://localhost:3000
echo Backend API:   http://localhost:8000
echo ==================================================
