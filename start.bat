@echo off
setlocal
cd /d "%~dp0"

echo Compilando clases Java...
call java\compilar.bat
if errorlevel 1 exit /b 1

echo Instalando dependencias Node si hace falta...
cd server-js
if not exist node_modules npm install
if errorlevel 1 exit /b 1

echo Iniciando ADDJ MOTORS en http://localhost:8080
npm start
