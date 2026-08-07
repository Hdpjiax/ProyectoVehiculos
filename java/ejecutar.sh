#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
java --add-modules jdk.httpserver -cp "java/out:java/lib/*" ServidorJava
