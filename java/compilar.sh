#!/usr/bin/env bash
set -e

if ! command -v javac >/dev/null 2>&1; then
  echo "Error: javac no esta instalado o no esta en el PATH." >&2
  exit 1
fi

mkdir -p out
javac --add-modules jdk.httpserver -encoding UTF-8 -d out Cliente.java Vehiculo.java GeneradorActa.java ConfiguracionBD.java JsonUtil.java ServidorJava.java
echo "Java compilado en la carpeta out."
