@echo off
color 0E
title TBT Cafe POS - Start Screen
setlocal

cd /d "%~dp0"

echo.
echo ====================================================
echo.
echo                 TBT CAFE POS - START
echo.
echo ====================================================
echo.
echo [+] Initializing Local Web Server...
echo [+] Connecting to USB Thermal Printer Router...
echo.
echo [!] Running background checks... (Please keep this window open)
echo.

:: Set your exact Windows Share/Printer name here:
set PRINTER_NAME=ThermalPrinter

runtime\node.exe launcher.js
pause
