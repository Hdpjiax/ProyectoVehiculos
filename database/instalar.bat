@echo off
setlocal
cd /d "%~dp0\.."

set "MYSQL=mysql"
where mysql >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set "MYSQL=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
  ) else if exist "C:\Program Files\MySQL\MySQL Workbench 8.0\mysql.exe" (
    set "MYSQL=C:\Program Files\MySQL\MySQL Workbench 8.0\mysql.exe"
  ) else (
    echo No se encontro mysql.exe. Instale MySQL Server o agregue MySQL al PATH.
    exit /b 1
  )
)

echo Se solicitara la contrasena de MySQL root.
"%MYSQL%" -u root -p < database\migrations\001_crear_base.sql
if errorlevel 1 exit /b 1
"%MYSQL%" -u root -p < database\migrations\002_mejoras_sistema.sql
if errorlevel 1 exit /b 1
"%MYSQL%" -u root -p < database\seeds\reset_demo_completo.sql
if errorlevel 1 exit /b 1

echo Base de datos instalada correctamente.
