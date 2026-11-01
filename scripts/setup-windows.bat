@echo off
echo Setting up Feedback Intelligence...
if not exist .env.local copy .env.example .env.local
call npm install
if errorlevel 1 (
  echo Installation failed. Check that Node.js 20.9+ is installed.
  pause
  exit /b 1
)
echo.
echo Setup complete. Run npm run dev to start the dashboard.
pause
