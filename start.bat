@echo off
echo ========================================
echo   Starting Skylink Application...
echo ========================================

REM 启动后端 Spring Boot (新窗口)
start "Skylink Backend" cmd /k "cd /d h:\IDE\Project_Advanced\Distributed-Database\skylink-backend && mvn spring-boot:run"

REM 等待 2 秒，让后端先启动
timeout /t 2 /nobreak > nul

REM 启动前端 (新窗口)
start "Skylink Frontend" cmd /k "cd /d h:\IDE\Project_Advanced\Distributed-Database\skylink-frontend && npm run dev"

echo.
echo Both services are starting in separate windows!
echo   - Backend: Spring Boot
echo   - Frontend: Vite Dev Server
echo.
pause
