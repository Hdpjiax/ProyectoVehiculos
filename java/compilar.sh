#!/usr/bin/env bash
set -e

if ! command -v javac >/dev/null 2>&1; then
  echo "Error: javac no esta instalado o no esta en el PATH." >&2
  exit 1
fi

mkdir -p out
javac -encoding UTF-8 -d out src/mx/edu/prepa/autos/Cliente.java src/mx/edu/prepa/autos/Vehiculo.java src/mx/edu/prepa/autos/GeneradorActa.java
echo "Java compilado en la carpeta out."
