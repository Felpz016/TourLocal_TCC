@echo off
rem Atalho para o iniciar.ps1 que funciona mesmo com scripts bloqueados no PowerShell.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar.ps1" %*
