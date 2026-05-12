@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo Сайт: http://localhost:3000
echo Остановка: Ctrl+C
echo.
call npm start
if errorlevel 1 pause
