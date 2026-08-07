@echo off
cd /d "%~dp0"
where javac >nul 2>nul || (echo Instala JDK 17 y vuelve a ejecutar.& pause & exit /b 1)
if not exist "java\database.properties" (
  copy "java\database.properties.example" "java\database.properties" >nul
  echo Se creo java\database.properties. Ajusta la contrasena de MySQL y vuelve a ejecutar.
  pause
  exit /b 1
)
dir /b java\lib\mysql-connector-j-*.jar >nul 2>nul || (echo Falta el driver JDBC en java\lib\.& pause & exit /b 1)
call java\compilar.bat || (pause & exit /b 1)
call java\ejecutar.bat
