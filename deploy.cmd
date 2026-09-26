@echo off
REM Double-clickable wrapper. Passes any commit message through: deploy.cmd "my message"
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1" %*
