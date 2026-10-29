@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.4.7-hotspot"
set "PATH=%JAVA_HOME%\bin;C:\tools\apache-maven-3.9.11\bin;%PATH%"
cd /d "%~dp0"
echo Running Hospital Maintenance Isolation System Tests...
call "C:\tools\apache-maven-3.9.11\bin\mvn.cmd" test
