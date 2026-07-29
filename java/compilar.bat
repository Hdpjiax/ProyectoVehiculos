@echo off
if not exist out mkdir out
javac -d out src\mx\edu\prepa\autos\Cliente.java src\mx\edu\prepa\autos\Vehiculo.java src\mx\edu\prepa\autos\GeneradorActa.java
echo Java compilado en la carpeta out.
