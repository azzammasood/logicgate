@echo off
REM ============================================================
REM  Start LogicGate dev server on http://localhost:3001
REM  Double-click this file, or run:  start-logicgate.cmd
REM ============================================================

REM Run from this script's own folder (the project root).
cd /d "%~dp0"

echo.
echo   Starting LogicGate on http://localhost:3001 ...
echo   (Press Ctrl+C to stop)
echo.

REM Install dependencies on first run if node_modules is missing.
if not exist "node_modules" (
  echo   node_modules not found - installing dependencies first...
  call npm install
  if errorlevel 1 (
    echo.
    echo   npm install failed. Fix the errors above and try again.
    pause
    exit /b 1
  )
)

REM "npm run dev" runs: prisma generate ^&^& next dev -p 3001
call npm run dev

REM Keep the window open if the server exits (so you can read errors).
echo.
echo   LogicGate stopped.
pause
