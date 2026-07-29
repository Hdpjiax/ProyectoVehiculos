#!/usr/bin/env bash
mkdir -p out
javac -d out src/mx/edu/prepa/autos/Cliente.java src/mx/edu/prepa/autos/Vehiculo.java src/mx/edu/prepa/autos/GeneradorActa.java
echo "Java compilado en la carpeta out."
