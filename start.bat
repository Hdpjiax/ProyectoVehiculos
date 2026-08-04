@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

:: 1. Detect and configure PATH for dependencies
echo Buscando dependencias del sistema...

:: --- Node.js ---
where node >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\nodejs" (
    set "PATH=!PATH!;C:\Program Files\nodejs"
    echo [INFO] Se agrego Node.js al PATH temporal.
  ) else (
    echo [WARNING] Node.js no esta en el PATH ni en la ruta predeterminada.
  )
)

:: --- Java ---
where java >nul 2>nul
if errorlevel 1 (
  for /d %%d in ("C:\Program Files\Java\jdk-*") do (
    if exist "%%d\bin\java.exe" (
      set "PATH=!PATH!;%%d\bin"
      echo [INFO] Se agrego Java desde %%d al PATH temporal.
    )
  )
)

:: --- MySQL ---
set "MYSQL_BIN="
where mysql >nul 2>nul
if errorlevel 1 (
  if exist "C:\xampp\mysql\bin\mysql.exe" (
    set "MYSQL_BIN=C:\xampp\mysql\bin\"
    set "PATH=!PATH!;C:\xampp\mysql\bin"
    echo [INFO] Se agrego MySQL de XAMPP al PATH temporal.
  ) else (
    for /d %%d in ("C:\Program Files\MySQL\MySQL Server *") do (
      if exist "%%d\bin\mysql.exe" (
        set "MYSQL_BIN=%%d\bin\"
        set "PATH=!PATH!;%%d\bin"
        echo [INFO] Se agrego MySQL desde %%d al PATH temporal.
      )
    )
  )
) else (
  for /f "delims=" %%i in ('where mysql') do (
    set "MYSQL_BIN=%%~dpi"
  )
)

if not defined MYSQL_BIN (
  set "MYSQL=mysql"
  set "MYSQLD=mysqld"
) else (
  set "MYSQL=%MYSQL_BIN%mysql.exe"
  set "MYSQLD=%MYSQL_BIN%mysqld.exe"
)

:: Verify installations
node -v >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado. Por favor instale Node.js antes de continuar.
  pause
  exit /b 1
)

java -version >nul 2>nul
if errorlevel 1 (
  echo [WARNING] Java no esta instalado. La generacion de actas no funcionara correctamente.
)

if not exist "%MYSQL%" (
  where mysql >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] No se encontro mysql.exe. Instale MySQL Server o agregue MySQL al PATH.
    pause
    exit /b 1
  )
)

:: 2. Prompt user for MySQL password
set "DB_PASS="
set /p "DB_PASS=Ingrese su contrasena de MySQL root (deje vacio si no tiene contrasena): "

if "!DB_PASS!"=="" (
  "%MYSQL%" -u root -e "SELECT 1" >nul 2>&1
) else (
  "%MYSQL%" -u root -p"!DB_PASS!" -e "SELECT 1" >nul 2>&1
)

if !errorlevel! equ 0 (
  echo [SUCCESS] Conectado exitosamente a MySQL.
) else (
  echo [ERROR] La contrasena ingresada es incorrecta o no se pudo conectar a MySQL.
  pause
  exit /b 1
)

:Migrar
echo =========================================================
echo PREPARANDO CONFIGURACION Y MIGRANDO BASE DE DATOS
echo =========================================================

:: Ensure server-js/database.local.js exists and is configured
if not exist "server-js\database.local.js" (
  echo [INFO] Creando server-js\database.local.js...
  copy "server-js\database.config.example.js" "server-js\database.local.js" >nul
)

:: Force password in database.local.js to match DB_PASS
echo [INFO] Asegurando contrasena en database.local.js...
node -e "const fs = require('fs'); const f = 'server-js/database.local.js'; fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/password:\s*'[^']*'/, 'password: \'' + (process.env.DB_PASS || '').replace(/\\/g, '\\\\').replace(/'/g, '\\\'') + '\''), 'utf8');"

:: Execute SQL scripts
echo [INFO] Ejecutando 001_crear_base.sql...
if "!DB_PASS!"=="" (
  "%MYSQL%" -u root < database\migrations\001_crear_base.sql
) else (
  "%MYSQL%" -u root -p"!DB_PASS!" < database\migrations\001_crear_base.sql
)
if errorlevel 1 goto MigError

echo [INFO] Ejecutando 002_mejoras_sistema.sql...
if "!DB_PASS!"=="" (
  "%MYSQL%" -u root < database\migrations\002_mejoras_sistema.sql
) else (
  "%MYSQL%" -u root -p"!DB_PASS!" < database\migrations\002_mejoras_sistema.sql
)
if errorlevel 1 goto MigError

echo [INFO] Ejecutando 001_datos_demo.sql...
if "!DB_PASS!"=="" (
  "%MYSQL%" -u root < database\seeds\001_datos_demo.sql
) else (
  "%MYSQL%" -u root -p"!DB_PASS!" < database\seeds\001_datos_demo.sql
)
if errorlevel 1 goto MigError

echo [SUCCESS] Migraciones y datos semilla aplicados correctamente.
goto CompilarJava

:MigError
echo [ERROR] Ocurrio un error al ejecutar las migraciones de la base de datos.
pause
exit /b 1

:CompilarJava
echo =========================================================
echo COMPILANDO COMPONENTES DE JAVA
echo =========================================================
pushd java
call compilar.bat
popd
if errorlevel 1 (
  echo [WARNING] Fallo la compilacion de Java. El sistema continuara pero algunas funciones podrian no estar disponibles.
)

echo =========================================================
echo INSTALANDO DEPENDENCIAS DE NODE.JS
echo =========================================================
cd server-js
if not exist node_modules (
  echo [INFO] Instalando dependencias por primera vez - esto puede tardar...
  call npm install
) else (
  echo [INFO] Las dependencias de Node.js ya estan instaladas.
)
if errorlevel 1 (
  echo [ERROR] Fallo al instalar las dependencias de Node.js.
  cd ..
  pause
  exit /b 1
)

echo =========================================================
echo INICIANDO EL SERVIDOR DE ADDJ MOTORS
echo =========================================================
echo [INFO] El sistema estara disponible en http://localhost:8080
start "" "http://localhost:8080"
call npm start
cd ..
