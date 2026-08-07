#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v javac >/dev/null || ! command -v java >/dev/null; then
  echo "Instala JDK 17 y vuelve a ejecutar este archivo."
  exit 1
fi
if [ ! -f "java/database.properties" ]; then
  cp java/database.properties.example java/database.properties
  echo "Se creó java/database.properties. Ajusta la contraseña de MySQL y vuelve a ejecutar."
  exit 1
fi
if ! ls java/lib/mysql-connector-j-*.jar >/dev/null 2>&1; then
  echo "Falta el driver JDBC. Coloca mysql-connector-j-8.x.x.jar en java/lib/."
  exit 1
fi
./java/compilar.sh
exec ./java/ejecutar.sh
