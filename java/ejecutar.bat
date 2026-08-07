@echo off
cd /d "%~dp0.."
java --add-modules jdk.httpserver -cp "java\out;java\lib\*" ServidorJava
