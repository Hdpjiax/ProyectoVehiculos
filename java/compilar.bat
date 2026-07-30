@echo off
where javac >nul 2>nul
if errorlevel 1 (
  echo Error: javac no esta instalado o no esta en el PATH.
  exit /b 1
)

if not exist out mkdir out
javac -encoding UTF-8 -d out Cliente.java Vehiculo.java GeneradorActa.java
if errorlevel 1 exit /b 1
echo Java compilado en la carpeta out.
