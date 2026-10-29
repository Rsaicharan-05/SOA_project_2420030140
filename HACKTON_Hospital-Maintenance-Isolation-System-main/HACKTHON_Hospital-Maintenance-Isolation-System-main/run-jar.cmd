@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.4.7-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
cd /d "%~dp0"
echo Starting Hospital Maintenance Isolation System (Packaged JAR)...
java -jar target\hospital-maintenance-isolation-system-1.0.0.jar
